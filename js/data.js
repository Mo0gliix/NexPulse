// ============================================================
// NexPulse — Data access layer
// All database queries live here so pages stay clean.
// ============================================================

const data = {

  // ================== VITALS ==================

  /** Latest vitals reading for a patient */
  async latestVitals(patientId) {
    const { data, error } = await sb
      .from('vitals')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error(error);
    return data;
  },

  /** Vitals in a time window (for charts) */
  async vitalsRange(patientId, sinceISO) {
    const { data, error } = await sb
      .from('vitals')
      .select('*')
      .eq('patient_id', patientId)
      .gte('recorded_at', sinceISO)
      .order('recorded_at', { ascending: true });
    if (error) console.error(error);
    return data || [];
  },

  /** Insert a vitals reading (from watch, manual entry, etc.) */
  async recordVitals(patientId, reading) {
    const { data, error } = await sb
      .from('vitals')
      .insert([{ patient_id: patientId, ...reading }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ================== ALERTS ==================

  async recentAlerts(patientId, limit = 10) {
    const { data, error } = await sb
      .from('alerts')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) console.error(error);
    return data || [];
  },

  /** Alerts across ALL of a doctor's patients (unresolved first) */
  async doctorAlertFeed(doctorId, limit = 20) {
    // First, grab assigned patient IDs
    const { data: patients } = await sb
      .from('profiles')
      .select('id, full_name')
      .eq('assigned_doctor_id', doctorId);
    if (!patients || !patients.length) return [];

    const ids = patients.map(p => p.id);
    const { data: alerts, error } = await sb
      .from('alerts')
      .select('*')
      .in('patient_id', ids)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return []; }

    // Attach patient names
    const nameMap = Object.fromEntries(patients.map(p => [p.id, p.full_name]));
    return (alerts || []).map(a => ({ ...a, patient_name: nameMap[a.patient_id] }));
  },

  async createAlert(patientId, { severity, category, message, metadata }) {
    const { data, error } = await sb
      .from('alerts')
      .insert([{ patient_id: patientId, severity, category, message, metadata }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ================== PATIENTS (doctor side) ==================

  async doctorPatients(doctorId) {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('assigned_doctor_id', doctorId)
      .eq('role', 'patient');
    if (error) console.error(error);
    return data || [];
  },

  /** Doctor's roster with each patient's latest vitals attached */
  async doctorRosterWithVitals(doctorId) {
    const patients = await this.doctorPatients(doctorId);
    if (!patients.length) return [];
    const withVitals = await Promise.all(
      patients.map(async (p) => {
        const latest = await this.latestVitals(p.id);
        return { ...p, latest_vitals: latest };
      })
    );
    return withVitals;
  },

  /** List of all doctors (for patient signup "choose your doctor") */
  async listDoctors() {
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, specialty')
      .eq('role', 'doctor');
    if (error) console.error(error);
    return data || [];
  },

  async assignDoctor(patientId, doctorId) {
    const { error } = await sb
      .from('profiles')
      .update({ assigned_doctor_id: doctorId })
      .eq('id', patientId);
    if (error) throw error;
  },

  // ================== APPOINTMENTS ==================

  async upcomingAppointments(userId, limit = 10) {
    const nowISO = new Date().toISOString();
    const { data, error } = await sb
      .from('appointments')
      .select('*, patient:patient_id(full_name), doctor:doctor_id(full_name)')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .gte('scheduled_at', nowISO)
      .order('scheduled_at', { ascending: true })
      .limit(limit);
    if (error) console.error(error);
    return data || [];
  },

  async todaysAppointments(doctorId) {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const { data, error } = await sb
      .from('appointments')
      .select('*, patient:patient_id(full_name)')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });
    if (error) console.error(error);
    return data || [];
  },

  async bookAppointment({ patientId, doctorId, scheduledAt, kind, location, notes }) {
    const { data, error } = await sb
      .from('appointments')
      .insert([{
        patient_id: patientId,
        doctor_id:  doctorId,
        scheduled_at: scheduledAt,
        kind, location, notes
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ================== CHAT ==================

  async listConversations(userId) {
    const { data, error } = await sb
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) console.error(error);
    return data || [];
  },

  async createConversation(userId, title = 'New conversation') {
    const { data, error } = await sb
      .from('conversations')
      .insert([{ user_id: userId, title }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listMessages(conversationId) {
    const { data, error } = await sb
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    return data || [];
  },

  async addMessage(conversationId, role, content) {
    const { data, error } = await sb
      .from('messages')
      .insert([{ conversation_id: conversationId, role, content }])
      .select()
      .single();
    if (error) throw error;
    // bump conversation updated_at
    await sb.from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    return data;
  },

  // ================== ACTIVITY LOG ==================

  async recentActivity(userId, limit = 10) {
    const { data, error } = await sb
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) console.error(error);
    return data || [];
  },

  async logActivity(userId, kind, description, metadata = null) {
    const { error } = await sb
      .from('activity_log')
      .insert([{ user_id: userId, kind, description, metadata }]);
    if (error) console.error(error);
  },

  // ================== REAL-TIME SUBSCRIPTIONS ==================

  /** Live-update callback when new vitals arrive for a patient */
  subscribeVitals(patientId, onInsert) {
    return sb.channel(`vitals-${patientId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals', filter: `patient_id=eq.${patientId}` },
        (payload) => onInsert(payload.new)
      )
      .subscribe();
  },

  subscribeAlerts(patientId, onInsert) {
    return sb.channel(`alerts-${patientId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `patient_id=eq.${patientId}` },
        (payload) => onInsert(payload.new)
      )
      .subscribe();
  }
};

window.data = data;
