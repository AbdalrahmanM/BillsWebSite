import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import MotionToast, { Toast, MotionSwap } from "../components/MotionToast";
import HelpModal from '../components/HelpModal';
import { useLanguage } from "../LanguageProvider";
import { useTranslation } from 'react-i18next';

const Login = () => {
	const { lang, toggleLang } = useLanguage();
	const { t, i18n } = useTranslation();
	const isAr = lang === 'ar';
	const [showAbout, setShowAbout] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [helpOpen, setHelpOpen] = useState(false);
	const navigate = useNavigate();

	// Keep i18n language in sync with the custom provider for a gradual migration
	useEffect(() => {
		if (i18n.language !== lang) {
			i18n.changeLanguage(lang);
		}
	}, [lang, i18n]);

	const pushToast = useCallback((type: Toast["type"], message: string) => {
		setToasts((prev) => [...prev, { id: Date.now() + Math.random(), type, message }]);
	}, []);

	const dismissToast = useCallback((id: number) => {
		setToasts((prev) => prev.filter(t => t.id !== id));
	}, []);

	// Show flash toast after redirects (e.g., logout)
	useEffect(() => {
		try {
			const raw = sessionStorage.getItem('flashToast');
			if (raw) {
				const parsed = JSON.parse(raw) as { type: Toast["type"]; message: string };
				pushToast(parsed.type, parsed.message);
				sessionStorage.removeItem('flashToast');
			}
		} catch {}
	}, [pushToast]);

	// Load remembered phone and preference
	useEffect(() => {
		try {
		const savedPhone = localStorage.getItem('rememberPhone') || '';
		const savedRemember = localStorage.getItem('rememberMe') === 'true';
		if (savedPhone) setPhone(savedPhone);
		setRememberMe(savedRemember);
		} catch {}
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-cover bg-center relative" style={{ backgroundImage: "url('/background/login-bg.jpg')" }}>
			{/* طبقة زجاجية مع تدرج لوني */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-white/30 to-blue-400/30 backdrop-blur-xl z-0" />
				{/* منطقة المحتوى الأساسية في الوسط */}
				<div className="relative z-10 flex-1 w-full flex items-center justify-center mb-4">
					<div className="relative z-10 flex flex-col items-center w-full max-w-md px-10 py-14 rounded-3xl shadow-2xl bg-white/30 border border-blue-200 animate-fade-in-slow" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
						{/* Language toggle inside the card */}
						<button
							className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-20 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/80 backdrop-blur border border-white/60 shadow hover:bg-white transition`}
							onClick={() => { toggleLang(); }}
							aria-label={t('common.toggleLanguage')}
						>
							<MotionSwap switchKey={i18n.language}>
								{lang === 'ar' ? 'AR' : 'EN'}
							</MotionSwap>
						</button>
				{/* صورة الشعار مستطيلة بحواف ناعمة وظل قوي وحجم أكبر جداً جداً */}
				<div className="overflow-hidden rounded-2xl shadow-2xl mb-10 w-80 h-52 flex items-center justify-center bg-white ring-4 ring-blue-200 border border-blue-100">
					<img src="/background/login-bg.jpg" alt={t('common.headerImageAlt')} className="w-full h-full object-cover rounded-2xl" />
				</div>
				<h1 className="text-3xl font-bold text-blue-800 mb-2 tracking-wide font-sans drop-shadow">
					<MotionSwap switchKey={i18n.language}>
						{t('login.title')}
					</MotionSwap>
				</h1>
				<p className="text-gray-700 mb-8 text-center text-base font-normal">
					<MotionSwap switchKey={i18n.language}>
						{t('login.subtitle')}
					</MotionSwap>
				</p>
					<button
					className="w-full py-3 bg-blue-700/80 text-white rounded-lg font-bold text-lg shadow-md hover:bg-blue-800/90 transition-all duration-200 mb-4 focus:ring-2 focus:ring-blue-400"
					onClick={() => setShowLoginModal(true)}
				>
					<MotionSwap switchKey={i18n.language}>
						{t('login.open')}
					</MotionSwap>
				</button>

			{/* نافذة منبثقة لتسجيل الدخول */}
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
					<div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-blue-200">
						<button
							className="absolute top-3 right-3 text-gray-400 hover:text-blue-700 text-xl font-bold"
							onClick={() => setShowLoginModal(false)}
							aria-label={t('common.close')}
						>
							×
						</button>
									<form noValidate className="flex flex-col gap-6" onSubmit={async (e) => {
										e.preventDefault();
										setError("");
										// تحقق الحقول قبل النداء على قاعدة البيانات
										if (!phone.trim()) {
											pushToast('warning', t('login.errorPhoneRequired'));
											return;
										}
										if (!password) {
											pushToast('warning', t('login.errorPasswordRequired'));
											return;
										}
										try {
											// البحث عن المستخدم برقم الهاتف
											const q = query(collection(db, "Users"), where("phone", "==", phone));
											const querySnapshot = await getDocs(q);
											if (querySnapshot.empty) {
												setError(t('login.errorPhoneNotRegistered'));
												pushToast('error', t('login.errorPhoneNotRegistered'));
												return;
											}
											let found = false;
											querySnapshot.forEach((doc) => {
												const data = doc.data();
												if (data.password === password) {
													found = true;
												}
											});
											if (found) {
												// Persist login token-ish and remember preference/phone
												localStorage.setItem('rememberMe', String(rememberMe));
												if (rememberMe) {
													localStorage.setItem('rememberPhone', phone);
													localStorage.setItem("userPhone", phone);
													try { sessionStorage.removeItem("userPhone"); } catch {}
												} else {
													try {
														sessionStorage.setItem("userPhone", phone);
														localStorage.removeItem("userPhone");
														localStorage.removeItem('rememberPhone');
													} catch {}
												}
												pushToast('success', t('login.successSignedIn'));
												setShowLoginModal(false);
												setTimeout(() => navigate("/home"), 900);
											} else {
												setError(t('login.errorIncorrectPassword'));
												pushToast('error', t('login.errorIncorrectPassword'));
											}
										} catch (err) {
											setError(t('login.errorSigningIn'));
											pushToast('error', t('login.errorSigningIn'));
										}
									}}>
										<div>
														<label className="block text-gray-700 font-semibold mb-1">
															<MotionSwap switchKey={i18n.language}>{t('login.phoneLabel')}</MotionSwap>
														</label>
											<div className="flex items-center border-b border-gray-300 py-2">
												<span className="material-icons text-gray-400 mr-2" style={{ fontSize: '22px' }}>call</span>
															<input type="text" placeholder={t('login.phonePlaceholder')} className="w-full outline-none bg-transparent" value={phone} onChange={e => setPhone(e.target.value)} />
											</div>
										</div>
										<div>
														<label className="block text-gray-700 font-semibold mb-1">
															<MotionSwap switchKey={i18n.language}>{t('login.passwordLabel')}</MotionSwap>
														</label>
											<div className="flex items-center border-b border-gray-300 py-2">
												<span className="material-icons text-gray-400 mr-2" style={{ fontSize: '22px' }}>lock</span>
															<input type="password" placeholder={t('login.passwordPlaceholder')} className="w-full outline-none bg-transparent" value={password} onChange={e => setPassword(e.target.value)} />
											</div>
										</div>
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												id="remember"
												className="accent-blue-600"
												checked={rememberMe}
												onChange={(e) => {
													const v = e.target.checked;
													setRememberMe(v);
													try { localStorage.setItem('rememberMe', String(v)); } catch {}
												}}
											/>
														<label htmlFor="remember" className="text-gray-700 text-sm">
															<MotionSwap switchKey={i18n.language}>{t('login.rememberMe')}</MotionSwap>
														</label>
										</div>
												{error && <div className="text-red-500 text-sm text-center">{error}</div>}
														<button type="submit" className="w-full py-3 bg-blue-700 text-white rounded-full font-bold text-lg shadow-md hover:bg-blue-800 transition-all duration-200 mt-2">
															<MotionSwap switchKey={i18n.language}>{t('login.signIn')}</MotionSwap>
														</button>
														<button type="button" onClick={() => setHelpOpen(true)} className="block mx-auto text-center text-purple-600 mt-4 underline">
															<MotionSwap switchKey={i18n.language}>{t('common.getHelp')}</MotionSwap>
														</button>
									</form>
												<footer className="w-full text-center text-[11px] text-gray-500 mt-6 opacity-90">
													<div>
														<MotionSwap switchKey={i18n.language}>© 2025 ForgeMind. {t('common.rights')}</MotionSwap>
													</div>
													<div className="opacity-90">
														<MotionSwap switchKey={i18n.language}>{t('common.designedBy')}</MotionSwap>
													</div>
										</footer>
						</div>
					</div>
				)}

						{/* Toasts moved outside this container to avoid being clipped by sibling stacking contexts */}
						<div className="flex justify-center gap-8 mb-8 w-full">
							<div className="flex flex-col items-center">
								<button
									className="flex items-center gap-1 text-purple-700 text-sm underline hover:text-purple-900 transition font-semibold"
									onMouseEnter={() => setShowAbout(true)}
									onMouseLeave={() => setShowAbout(false)}
								>
									{t('about.label')}
								</button>
							</div>
							<button onClick={() => setHelpOpen(true)} className="text-purple-700 text-sm underline hover:text-purple-900 transition font-semibold">{t('common.getHelp')}</button>
						</div>
						<HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
					</div>
				</div>

			{/* Footer أسفل الصفحة (مخفي عند فتح نافذة تسجيل الدخول) */}
			{!showLoginModal && (
				<footer className="relative z-10 w-full flex justify-center mb-6 px-4" aria-label={t('common.pageRights')}>
					<div className="px-5 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-lg text-[11px] leading-tight text-gray-700 text-center w-[76vw] max-w-[360px] sm:max-w-[400px]">
						<div className="font-medium">
							<MotionSwap switchKey={i18n.language}>© 2025 ForgeMind. {t('common.rights')}</MotionSwap>
						</div>
						<div className="text-[10px] opacity-80">
							<MotionSwap switchKey={i18n.language}>{t('common.designedBy')}</MotionSwap>
						</div>
					</div>
				</footer>
			)}

			{/* نافذة منبثقة عصرية لعرض About Us عند Hover مع زر إغلاق */}
			{showAbout && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
					onMouseEnter={() => setShowAbout(true)}
					onMouseLeave={() => setShowAbout(false)}
				>
					<div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-purple-200">
						<button
							className="absolute top-3 right-3 text-gray-400 hover:text-purple-700 text-xl font-bold"
							onClick={() => setShowAbout(false)}
							aria-label={t('common.close')}
						>
							×
						</button>
						<div className="flex flex-col items-center mb-4">
							<img src="/background/login-bg.jpg" alt={t('common.headerImageAlt')} className="w-12 h-12 rounded-full shadow border border-purple-200 mb-2" />
							<span className="font-bold text-purple-700 text-lg">{t('about.label')}</span>
						</div>
						<p className="text-gray-700 text-sm text-center">{t('about.text')}</p>
					</div>
				</div>
			)}

			{/* Toasts placed at root level for highest stacking over footer and overlays */}
			<MotionToast toasts={toasts} onDismiss={dismissToast} />
		</div>
	);
};

export default Login;
