// ============================================================
// NexPulse — Authentication
// Handles signup, login, logout, and role-based redirects.
// ============================================================

const auth = {

  // ---- SIGN UP ----
  async signUp({ email, password, fullName, role }) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }  // goes into raw_user_meta_data
      }
    });
    if (error) throw error;
    return data;
  },

  // ---- LOG IN ----
  async signIn({ email, password }) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // ---- LOG OUT ----
  async signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    window.location.href = 'login.html';
  },

  // ---- CURRENT SESSION ----
  async getSession() {
    const { data: { session } } = await sb.auth.getSession();
    return session;
  },

  // ---- CURRENT USER + PROFILE ----
  async getCurrentProfile() {
    const session = await this.getSession();
    if (!session) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) { console.error(error); return null; }
    return data;
  },

  // ---- ROUTE GUARDS (call on page load) ----
  async requireAuth(expectedRole /* 'patient' | 'doctor' | null */) {
    const profile = await this.getCurrentProfile();
    if (!profile) {
      window.location.href = 'login.html';
      return null;
    }
    if (expectedRole && profile.role !== expectedRole) {
      // wrong dashboard — route to correct one
      window.location.href = profile.role === 'doctor'
        ? 'dashboard-doctor.html'
        : 'dashboard-patient.html';
      return null;
    }
    return profile;
  },

  // ---- DASHBOARD BY ROLE ----
  dashboardFor(role) {
    return role === 'doctor' ? 'dashboard-doctor.html' : 'dashboard-patient.html';
  }
};

window.auth = auth;
