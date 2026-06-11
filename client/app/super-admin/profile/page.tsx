'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  User, Mail, ShieldAlert, KeyRound, Building2, LogOut, Eye, EyeOff,
  Bell, Globe, Smartphone, Monitor, Settings, Camera, Check, AlertCircle, Phone
} from 'lucide-react';

const translations: Record<string, Record<string, string>> = {
  en: {
    title: "Super Admin Profile",
    subtitle: "Manage credentials, view authorization levels, and control active workspace logins",
    role: "Platform Owner",
    editBtn: "Edit Profile Details",
    email: "Email Address",
    phone: "Phone Number",
    phonePlaceholder: "No phone number provided",
    saveBtn: "Save Details",
    cancelBtn: "Cancel",
    securityTitle: "Security Credentials",
    currPwd: "Current Password",
    newPwd: "New Password",
    confPwd: "Confirm New Password",
    updateCreds: "Update Credentials",
    advSecurity: "Advanced Security",
    twoFactor: "Two-Factor Authentication (2FA)",
    twoFactorDesc: "Add an extra layer of security to your account",
    activeSessions: "Active Sessions",
    currSession: "Current Session",
    preferences: "Preferences",
    emailAlerts: "Email Alerts",
    emailAlertsDesc: "Receive system alerts",
    language: "Language",
    sessionMgmt: "Session Management",
    sessionMgmtDesc: "Ready to leave? Make sure you save any unsaved work before logging out.",
    logoutBtn: "Logout from System",
    nameLabel: "Full Name",
    photoLabel: "Profile Photo URL",
    updating: "Saving...",
    updatingPassword: "Updating...",
    pwdSuccess: "Password changed successfully!",
    profileSuccess: "Profile details updated successfully!",
    pwdErrorEmpty: "Please fill in all password fields.",
    pwdErrorMismatch: "New passwords do not match.",
    pwdErrorShort: "Password must be at least 6 characters.",
    logoutOtherBtn: "Logout Other Devices",
    logoutOtherSuccess: "Successfully logged out from all other devices!",
    revokeSessionSuccess: "Session revoked successfully!",
    enterCurrentPwd: "Enter current password",
    enterNewPwd: "Enter new password",
    confirmNewPwd: "Confirm new password"
  },
  es: {
    title: "Perfil de Superadministrador",
    subtitle: "Administre credenciales, vea niveles de autorización y controle inicios de sesión activos",
    role: "Propietario de la plataforma",
    editBtn: "Editar detalles del perfil",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    phonePlaceholder: "No se proporcionó número de teléfono",
    saveBtn: "Guardar detalles",
    cancelBtn: "Cancelar",
    securityTitle: "Credenciales de seguridad",
    currPwd: "Contraseña actual",
    newPwd: "Nueva contraseña",
    confPwd: "Confirmar nueva contraseña",
    updateCreds: "Actualizar credenciales",
    advSecurity: "Seguridad avanzada",
    twoFactor: "Autenticación de dos factores (2FA)",
    twoFactorDesc: "Agregue una capa adicional de seguridad a su cuenta",
    activeSessions: "Sesiones activas",
    currSession: "Sesión actual",
    preferences: "Preferencias",
    emailAlerts: "Alertas de correo electrónico",
    emailAlertsDesc: "Recibir alertas del sistema",
    language: "Idioma",
    sessionMgmt: "Gestión de sesiones",
    sessionMgmtDesc: "¿Listo para salir? Asegúrese de guardar el trabajo no guardado antes de cerrar sesión.",
    logoutBtn: "Cerrar sesión del sistema",
    nameLabel: "Nombre completo",
    photoLabel: "URL de la foto de perfil",
    updating: "Guardando...",
    updatingPassword: "Actualizando...",
    pwdSuccess: "¡Contraseña cambiada con éxito!",
    profileSuccess: "¡Detalles del perfil actualizados con éxito!",
    pwdErrorEmpty: "Por favor, complete todos los campos de contraseña.",
    pwdErrorMismatch: "Las nuevas contraseñas no coinciden.",
    pwdErrorShort: "La contraseña debe tener al menos 6 caracteres.",
    logoutOtherBtn: "Cerrar sesión en otros dispositivos",
    logoutOtherSuccess: "¡Sesión cerrada correctamente en los demás dispositivos!",
    revokeSessionSuccess: "¡Sesión revocada con éxito!",
    enterCurrentPwd: "Introducir contraseña actual",
    enterNewPwd: "Introducir nueva contraseña",
    confirmNewPwd: "Confirmar nueva contraseña"
  },
  fr: {
    title: "Profil du Super Administrateur",
    subtitle: "Gérer les identifiants, afficher les niveaux d'autorisation et contrôler les connexions actives",
    role: "Propriétaire de la plateforme",
    editBtn: "Modifier les détails du profil",
    email: "Adresse e-mail",
    phone: "Numéro de téléphone",
    phonePlaceholder: "Aucun numéro de téléphone fourni",
    saveBtn: "Enregistrer les détails",
    cancelBtn: "Annuler",
    securityTitle: "Identifiants de sécurité",
    currPwd: "Mot de passe actuel",
    newPwd: "Nouveau mot de passe",
    confPwd: "Confirmer le nouveau mot de passe",
    updateCreds: "Mettre à jour les identifiants",
    advSecurity: "Sécurité avancée",
    twoFactor: "Authentification à deux facteurs (2FA)",
    twoFactorDesc: "Ajoutez une couche de sécurité supplémentaire à votre compte",
    activeSessions: "Sessions actives",
    currSession: "Session actuelle",
    preferences: "Préférences",
    emailAlerts: "Alertes e-mail",
    emailAlertsDesc: "Recevoir les alertes système",
    language: "Langue",
    sessionMgmt: "Gestion de session",
    sessionMgmtDesc: "Prêt à partir? Assurez-vous de sauvegarder vos modifications avant de vous déconnecter.",
    logoutBtn: "Se déconnecter du système",
    nameLabel: "Nom complet",
    photoLabel: "URL de la photo de profil",
    updating: "Enregistrement...",
    updatingPassword: "Mise à jour...",
    pwdSuccess: "Mot de passe changé avec succès!",
    profileSuccess: "Détails du profil mis à jour avec succès!",
    pwdErrorEmpty: "Veuillez remplir tous les champs de mot de passe.",
    pwdErrorMismatch: "Les nouveaux mots de passe ne correspondent pas.",
    pwdErrorShort: "Le mot de passe doit comporter au moins 6 caractères.",
    logoutOtherBtn: "Déconnecter les autres appareils",
    logoutOtherSuccess: "Déconnexion réussie de tous les autres appareils !",
    revokeSessionSuccess: "Session révoquée avec succès !",
    enterCurrentPwd: "Saisir le mot de passe actuel",
    enterNewPwd: "Saisir le nouveau mot de passe",
    confirmNewPwd: "Confirmer le nouveau mot de passe"
  },
  de: {
    title: "Super-Admin-Profil",
    subtitle: "Anmeldeinformationen verwalten, Autorisierungsstufen anzeigen und aktive Sitzungen kontrollieren",
    role: "Plattform-Eigentümer",
    editBtn: "Profildetails bearbeiten",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    phonePlaceholder: "Keine Telefonnummer angegeben",
    saveBtn: "Details speichern",
    cancelBtn: "Abbrechen",
    securityTitle: "Sicherheitsanmeldedaten",
    currPwd: "Aktuelles Passwort",
    newPwd: "Neues Passwort",
    confPwd: "Neues Passwort bestätigen",
    updateCreds: "Anmeldedaten aktualisieren",
    advSecurity: "Erweiterte Sicherheit",
    twoFactor: "Zwei-Faktor-Authentifizierung (2FA)",
    twoFactorDesc: "Fügen Sie Ihrem Konto eine zusätzliche Sicherheitsstufe hinzu",
    activeSessions: "Aktive Sitzungen",
    currSession: "Aktuelle Sitzung",
    preferences: "Einstellungen",
    emailAlerts: "E-Mail-Benachrichtigungen",
    emailAlertsDesc: "Systembenachrichtigungen erhalten",
    language: "Sprache",
    sessionMgmt: "Sitzungsverwaltung",
    sessionMgmtDesc: "Bereit zu gehen? Speichern Sie Ihre Arbeit, bevor Sie sich abmelden.",
    logoutBtn: "Vom System abmelden",
    nameLabel: "Vollständiger Name",
    photoLabel: "Profilbild-URL",
    updating: "Speichern...",
    updatingPassword: "Aktualisieren...",
    pwdSuccess: "Passwort erfolgreich geändert!",
    profileSuccess: "Profildetails erfolgreich aktualisiert!",
    pwdErrorEmpty: "Bitte füllen Sie alle Passwortfelder aus.",
    pwdErrorMismatch: "Neue Passwörter stimmen nicht überein.",
    pwdErrorShort: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    logoutOtherBtn: "Von anderen Geräten abmelden",
    logoutOtherSuccess: "Erfolgreich von allen anderen Geräten abgemeldet!",
    revokeSessionSuccess: "Sitzung erfolgreich widerrufen!",
    enterCurrentPwd: "Aktuelles Passwort eingeben",
    enterNewPwd: "Neues Passwort eingeben",
    confirmNewPwd: "Neues Passwort bestätigen"
  }
};

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const setUser = useAuthStore(s => s.setUser);

  // Profile fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [language, setLanguage] = useState('en');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences / Advanced Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Active Sessions state
  interface SessionItem {
    id: string;
    token: string;
    device: string;
    ip: string;
    createdAt: string;
    expiresAt: string;
  }

  const currentRefreshToken = useAuthStore(s => s.refreshToken);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState({ type: '', text: '' });

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/active-sessions', {
        params: { currentRefreshToken }
      });
      setSessions(res.data.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (!currentRefreshToken) return;
    try {
      setIsRevokingAll(true);
      setSessionMessage({ type: '', text: '' });
      await api.post('/auth/logout-other-devices', { currentRefreshToken });
      setSessionMessage({ type: 'success', text: t('logoutOtherSuccess') });
      await fetchSessions();
    } catch (err: any) {
      setSessionMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setIsRevokingAll(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      setSessionMessage({ type: '', text: '' });
      await api.post('/auth/revoke-session', { sessionId });
      setSessionMessage({ type: 'success', text: t('revokeSessionSuccess') });
      await fetchSessions();
    } catch (err: any) {
      setSessionMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Translate helper function
  const t = (key: string): string => {
    const langKey = language in translations ? language : 'en';
    return translations[langKey][key] || translations['en'][key] || key;
  };

  // Predefined nice gradient avatar colors
  const avatarPresets = [
    'from-blue-600 to-amber-400',
    'from-emerald-600 to-emerald-400',
    'from-violet-600 to-violet-400',
    'from-rose-600 to-rose-400',
    'from-amber-600 to-amber-400',
    'from-fuchsia-600 to-fuchsia-400'
  ];

  const presetIndex = name ? (name.charCodeAt(0) % avatarPresets.length) : 0;
  const avatarBg = avatarPresets[presetIndex];

  // Sync state when store user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setPhotoUrl(user.photoUrl || '');
      setLanguage(user.language || 'en');
    }
  }, [user]);

  // Fetch fresh profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/auth/profile');
        if (res.data?.data?.user) {
          const freshUser = res.data.data.user;
          // Sync with Zustand store
          setUser({
            ...user,
            name: freshUser.name,
            email: freshUser.email,
            phone: freshUser.phone || '',
            photoUrl: freshUser.photo_url || '',
            language: freshUser.language || 'en'
          } as any);
        }
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      }
    }
    fetchProfile();
    fetchSessions();
  }, [setUser]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        photo_url: photoUrl.trim(),
        language
      });
      if (res.data?.data?.user) {
        const updatedUser = res.data.data.user;
        setUser({
          ...user,
          name: updatedUser.name,
          phone: updatedUser.phone || '',
          photoUrl: updatedUser.photo_url || '',
          language: updatedUser.language || 'en'
        } as any);
        setProfileMessage({ type: 'success', text: t('profileSuccess') });
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile details' });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('pwdErrorEmpty') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('pwdErrorMismatch') });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('pwdErrorShort') });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordMessage({ type: 'success', text: t('pwdSuccess') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update credentials' });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleLanguageChange(lang: string) {
    setLanguage(lang);
    try {
      const res = await api.put('/auth/profile', { language: lang });
      if (res.data?.data?.user) {
        setUser({
          ...user,
          language: res.data.data.user.language || 'en'
        } as any);
        setProfileMessage({
          type: 'success',
          text: lang === 'es' ? '¡Idioma cambiado con éxito!' :
                lang === 'fr' ? 'Langue changée avec succès !' :
                lang === 'de' ? 'Sprache erfolgreich geändert!' :
                'Language changed successfully!'
        });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Failed to change language', err);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{t('title')}</h1>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="bg-card rounded-2xl border border-slate-200/60 p-6 flex flex-col items-center relative overflow-hidden">
          {photoUrl && (photoUrl.startsWith('http') || photoUrl.startsWith('/')) ? (
            <img src={photoUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover shadow-md border border-slate-100 dark:border-[#1f1f1f]" />
          ) : (
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-500/20`}>
              {name?.[0]?.toUpperCase() || 'S'}
            </div>
          )}
          
          <h2 className="mt-4 text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">{name || 'Super Admin'}</h2>
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 mt-2">{t('role')}</span>

          {profileMessage.text && (
            <div className={`w-full mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}>
              {profileMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          {!isEditing ? (
            <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-[#1f1f1f] text-left">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                <span>{name || 'Super Admin'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{email || 'superadmin@jobnest.com'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{phone || t('phonePlaceholder')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{t('role')}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 py-2 bg-slate-50 dark:bg-[#161616] border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition duration-200 flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> {t('editBtn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="w-full mt-6 space-y-4 pt-6 border-t border-slate-100 dark:border-[#1f1f1f] text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('nameLabel')} *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('photoLabel')}</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-amber-400 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileMessage({ type: '', text: '' });
                    if (user) {
                      setName(user.name || '');
                      setPhone(user.phone || '');
                      setPhotoUrl(user.photoUrl || '');
                    }
                  }}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2 bg-[#F59E0B] text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
                >
                  {isSavingProfile ? t('updating') : t('saveBtn')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Credentials */}
          <div className="bg-card rounded-2xl border border-slate-200/60 p-6 space-y-6">
            <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#F59E0B]" /> {t('securityTitle')}
            </h3>
            
            {passwordMessage.text && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {passwordMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">{t('currPwd')}</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder={showCurrentPassword ? t('enterCurrentPwd') : "••••••••"}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div />
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">{t('newPwd')}</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={showNewPassword ? t('enterNewPwd') : "••••••••"}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">{t('confPwd')}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder={showConfirmPassword ? t('confirmNewPwd') : "••••••••"}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="py-2.5 px-4 bg-[#F59E0B] text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
              >
                {isUpdatingPassword ? t('updatingPassword') : t('updateCreds')}
              </button>
            </form>
          </div>

          {/* Advanced Security */}
          <div className="bg-card rounded-2xl border border-slate-200/60 p-6 space-y-6">
            <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-500" /> {t('advSecurity')}
            </h3>
            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> {t('twoFactor')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{t('twoFactorDesc')}</p>
              </div>
              <button 
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between mt-4">
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase">{t('activeSessions')}</h4>
                {sessions.filter(s => s.token !== currentRefreshToken).length > 0 && (
                  <button
                    onClick={handleLogoutOtherDevices}
                    disabled={isRevokingAll}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 flex items-center gap-1 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors border border-rose-100"
                  >
                    {isRevokingAll ? t('updating') : t('logoutOtherBtn')}
                  </button>
                )}
              </div>

              {sessionMessage.text && (
                <div className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-2 ${
                  sessionMessage.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-rose-50/50 border-rose-100 text-rose-700'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sessionMessage.text}</span>
                </div>
              )}

              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 pl-1">No active sessions found.</p>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((s) => {
                    const isCurrent = s.token === currentRefreshToken;
                    return (
                      <div key={s.id} className="p-3 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-card flex items-center justify-between hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? 'bg-amber-50' : 'bg-slate-100'}`}>
                            <Monitor className={`w-4 h-4 ${isCurrent ? 'text-[#F59E0B]' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.device}</p>
                            {isCurrent ? (
                              <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">{t('currSession')}</p>
                            ) : (
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                Created: {new Date(s.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">IP: {s.ip}</span>
                          {!isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              disabled={revokingSessionId === s.id}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md border border-red-100/50 transition-colors"
                            >
                              {revokingSessionId === s.id ? '...' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-card rounded-2xl border border-slate-200/60 p-6 space-y-6">
            <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] uppercase flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-purple-500" /> {t('preferences')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2">
                    <Bell className="w-4 h-4" /> {t('emailAlerts')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{t('emailAlertsDesc')}</p>
                </div>
                <button 
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-[#F59E0B]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50 flex flex-col justify-center">
                <label className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {t('language')}
                </label>
                <select 
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full bg-card border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-400"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-card p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{t('sessionMgmt')}</h4>
          <p className="text-xs text-slate-400">{t('sessionMgmtDesc')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 transition-colors w-full sm:w-auto shrink-0"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {t('logoutBtn')}
        </button>
      </div>
    </div>
  );
}
