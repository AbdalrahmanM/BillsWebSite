import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal, in-memory resources to start migrating pages gradually.
// We can split these into separate JSON files later as the app grows.
const resources = {
  en: {
    translation: {
      common: {
        getHelp: 'Get help',
        rights: 'All Rights Reserved.',
        designedBy: 'Designed by Abdalrahman & Mohammed',
        support: 'Support',
  home: 'Home',
  all: 'All',
  close: 'Close',
  back: 'Back',
  toggleLanguage: 'Toggle language',
  headerImageAlt: 'Header image',
  pageRights: 'Page rights',
      },
      help: {
        title: "We're Here for You",
        subtitle: 'Our support team is here to assist you at any time.',
        actions: {
          email: 'Contact via Email',
          whatsapp: 'Contact via WhatsApp',
        },
        email: {
          subject: 'Billing Hub Support Request',
          body: 'Hello Support,\n\nI need help with ...',
        },
        whatsappMessage: 'Hello, I need help with my bills.',
      },
      about: {
        label: 'About Us',
        text:
          'We are a company specialized in managing residential complexes and providing modern billing and service solutions for communities. Our platform helps residents and managers streamline payments, announcements, and communication efficiently and securely.',
      },
      home: {
        loading: 'Loading',
        user: 'User',
        greeting: 'Hello, {{name}}',
        welcomeBack: 'Welcome back!',
        theme: {
          toLight: 'Switch to light mode',
          toDark: 'Switch to dark mode',
        },
        banner: {
          ads: 'Ads',
          announcement: 'Announcement',
          adsSubtitle: 'Check out our latest offers!',
          announcementSubtitle: 'Important Notice',
          showAds: 'Show Ads',
          showAnnouncement: 'Show Announcement',
        },
        bills: {
          none: 'No bills found.',
        },
        type: {
          water: 'Water',
          electricity: 'Electricity',
          gas: 'Gas',
          fees: 'Fees',
        },
        status: {
          paid: 'Paid',
          unpaid: 'Unpaid',
        },
        logout: {
          text: 'Logout',
          success: 'Logged out successfully',
        },
        idleLogoutMessage: 'You were logged out due to inactivity',
        whatsappMessage: 'Hello, I need help with my account. User: {{user}} | Phone: {{phone}}',
      },
      bills: {
        services: {
          water: 'Water Bills',
          electricity: 'Electricity Bills',
          gas: 'Gas Bills',
          fees: 'Fees',
        },
        overview: 'Overview of your {{service}} bills',
        monthsMap: {
          '01': 'Jan',
          '02': 'Feb',
          '03': 'Mar',
          '04': 'Apr',
          '05': 'May',
          '06': 'Jun',
          '07': 'Jul',
          '08': 'Aug',
          '09': 'Sep',
          '10': 'Oct',
          '11': 'Nov',
          '12': 'Dec',
        },
        filters: {
          months: 'months',
          allMonths: 'All months',
          years: 'years',
          allYears: 'All years',
          clear: 'Clear',
          sort: {
            newest: 'Newest',
            oldest: 'Oldest',
            amountHigh: 'Amount: High → Low',
            amountLow: 'Amount: Low → High',
          },
        },
        loadingBill: 'Loading bill',
        emptySection: 'No bills found for this section.',
        labels: {
          amount: 'Amount',
          bill: 'Bill',
          billId: 'Bill ID',
          date: 'Date',
          year: 'Year',
          month: 'Month',
          status: 'Status',
        },
        actions: {
          pay: 'Pay',
          requestBill: 'Request Bill',
        },
        detailsTitle: 'Bill Details',
        messages: {
          userNotFound: 'User not found',
          alreadyRequested: 'You have already requested this bill.',
          requestSuccess: 'Bill request sent successfully!',
          requestError: 'Something went wrong. Try again.',
        },
        whatsappMessage: 'Hello, I need help with my {{service}} bills. Bill: {{bill}} | Phone: {{phone}}',
      },
      announcement: {
        title: 'Announcement',
        subtitle: 'Attention Please',
        highlight: 'Attention Please: This is an important announcement for all users. Stay tuned for updates and make sure your contact information is up-to-date.',
        tags: {
          scheduled: 'Scheduled',
          new: 'New',
          promo: 'Promo',
        },
        whatsappMessage: 'Hello, I need help. Phone: {{phone}}',
      },
      ads: {
        title: 'Ads',
        subtitle: 'Browse latest community ads',
        actions: {
          goToAd: 'Go to Ad',
        },
        whatsappMessage: 'Hello, I need help. Phone: {{phone}}',
        items: {
          market: {
            title: 'Supermarket Offers',
            description: "Big discounts this week on groceries and household items. Don't miss out on our limited-time deals!",
          },
          park: {
            title: 'Community Park Event',
            description: 'Join our family-friendly event at the community park this Friday. Games, food, and fun for everyone!',
          },
          bmw: {
            title: 'BMW New Models',
            description: 'Explore the latest BMW models with exceptional performance and design. Test-drive today.',
          },
          'apple-vision': {
            title: 'Tech & New',
            description: 'Experience the next wave of spatial computing with stunning visuals and immersive apps.',
          },
        },
      },
      payment: {
        title: 'Payment',
        missingInfo: 'Missing payment info. Go back to bills.',
        chooseMethod: 'Choose payment method:',
        methods: {
          card: 'Bank Card',
          zain: 'Zain Cash',
        },
        placeholders: {
          cardNumber: 'Card Number',
          month: 'MM',
          year: 'YYYY',
          cvv: 'CVV',
          phone: 'Phone Number',
        },
        actions: {
          confirm: 'Confirm Payment',
          processing: 'Processing...',
        },
        errors: {
          userNotLoggedIn: 'User not logged in',
          userNotFound: 'User not found',
          billNotFound: 'Bill not found',
          failed: 'Payment failed',
        },
        success: 'Payment successful',
      },
      login: {
        title: 'Billing Hub',
        subtitle: 'Welcome back! Manage your bills and services easily.',
        open: 'LOGIN',
        signIn: 'SIGN IN',
        phoneLabel: 'Phone Number',
        phonePlaceholder: 'Enter Phone Number',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter Password',
        rememberMe: 'Remember me',
        successSignedIn: 'Signed in successfully',
        errorPhoneRequired: 'Please enter your phone number',
        errorPasswordRequired: 'Please enter your password',
        errorPhoneNotRegistered: 'Phone number is not registered',
        errorIncorrectPassword: 'Incorrect password',
        errorSigningIn: 'An error occurred while signing in',
      },
    },
  },
  ar: {
    translation: {
      common: {
        getHelp: 'مساعدة',
        rights: 'جميع الحقوق محفوظة.',
        designedBy: 'تصميم عبدالرحمن و محمد',
        support: 'الدعم',
  home: 'الرئيسية',
  all: 'الكل',
  close: 'إغلاق',
  back: 'رجوع',
  toggleLanguage: 'تبديل اللغة',
  headerImageAlt: 'صورة العنوان',
  pageRights: 'حقوق الصفحة',
      },
      help: {
        title: 'نحن هنا لمساعدتك',
        subtitle: 'فريق الدعم جاهز لمساعدتك في أي وقت.',
        actions: {
          email: 'التواصل عبر البريد',
          whatsapp: 'التواصل عبر واتساب',
        },
        email: {
          subject: 'طلب دعم مركز الفواتير',
          body: 'مرحباً فريق الدعم،\n\nأحتاج مساعدة بخصوص ...',
        },
        whatsappMessage: 'مرحباً، أحتاج مساعدة في فواتيري.',
      },
      about: {
        label: 'من نحن',
        text:
          'نحن شركة متخصصة في إدارة المجمعات السكنية وتقديم حلول حديثة للفوترة والخدمات للمجتمعات. منصتنا تساعد السكان والمديرين على تبسيط المدفوعات والإعلانات والتواصل بكفاءة وأمان.',
      },
      home: {
        loading: 'جاري التحميل',
        user: 'مستخدم',
        greeting: 'مرحباً، {{name}}',
        welcomeBack: 'مرحباً بعودتك!',
        theme: {
          toLight: 'التبديل إلى الوضع الفاتح',
          toDark: 'التبديل إلى الوضع الداكن',
        },
        banner: {
          ads: 'إعلانات',
          announcement: 'إشعار',
          adsSubtitle: 'اطّلع على أحدث عروضنا!',
          announcementSubtitle: 'تنبيه هام',
          showAds: 'عرض الإعلانات',
          showAnnouncement: 'عرض الإشعار',
        },
        bills: {
          none: 'لا توجد فواتير.',
        },
        type: {
          water: 'الماء',
          electricity: 'الكهرباء',
          gas: 'الغاز',
          fees: 'الرسوم',
        },
        status: {
          paid: 'مدفوع',
          unpaid: 'غير مدفوع',
        },
        logout: {
          text: 'تسجيل الخروج',
          success: 'تم تسجيل الخروج بنجاح',
        },
        idleLogoutMessage: 'تم تسجيل خروجك بسبب عدم النشاط',
        whatsappMessage: 'مرحباً، أحتاج مساعدة في حسابي. المستخدم: {{user}} | الهاتف: {{phone}}',
      },
      bills: {
        services: {
          water: 'فواتير الماء',
          electricity: 'فواتير الكهرباء',
          gas: 'فواتير الغاز',
          fees: 'الرسوم',
        },
        overview: 'نظرة عامة على فواتير {{service}}',
        monthsMap: {
          '01': 'يناير',
          '02': 'فبراير',
          '03': 'مارس',
          '04': 'أبريل',
          '05': 'مايو',
          '06': 'يونيو',
          '07': 'يوليو',
          '08': 'أغسطس',
          '09': 'سبتمبر',
          '10': 'أكتوبر',
          '11': 'نوفمبر',
          '12': 'ديسمبر',
        },
        filters: {
          months: 'الأشهر',
          allMonths: 'كل الأشهر',
          years: 'السنوات',
          allYears: 'كل السنوات',
          clear: 'مسح',
          sort: {
            newest: 'الأحدث',
            oldest: 'الأقدم',
            amountHigh: 'المبلغ: من الأعلى إلى الأقل',
            amountLow: 'المبلغ: من الأقل إلى الأعلى',
          },
        },
        loadingBill: 'جاري تحميل الفاتورة',
        emptySection: 'لا توجد فواتير ضمن هذا القسم.',
        labels: {
          amount: 'المبلغ',
          bill: 'الفاتورة',
          billId: 'معرّف الفاتورة',
          date: 'التاريخ',
          year: 'السنة',
          month: 'الشهر',
          status: 'الحالة',
        },
        actions: {
          pay: 'ادفع',
          requestBill: 'طلب فاتورة',
        },
        detailsTitle: 'تفاصيل الفاتورة',
        messages: {
          userNotFound: 'المستخدم غير موجود',
          alreadyRequested: 'لقد قمت بطلب هذه الفاتورة مسبقاً.',
          requestSuccess: 'تم إرسال طلب الفاتورة بنجاح!',
          requestError: 'حدث خطأ ما. حاول مرة أخرى.',
        },
        whatsappMessage: 'مرحباً، أحتاج مساعدة في فواتير {{service}}. الفاتورة: {{bill}} | الهاتف: {{phone}}',
      },
      announcement: {
        title: 'الإعلانات',
        subtitle: 'يرجى الانتباه',
        highlight: 'يرجى الانتباه: هذا إعلان مهم لجميع المستخدمين. ترقّبوا التحديثات وتأكدوا من أن معلومات التواصل لديكم محدّثة.',
        tags: {
          scheduled: 'مجدول',
          new: 'جديد',
          promo: 'عرض',
        },
        whatsappMessage: 'مرحباً، أحتاج مساعدة. الهاتف: {{phone}}',
      },
      ads: {
        title: 'الإعلانات',
        subtitle: 'تصفح أحدث إعلانات المجمع',
        actions: {
          goToAd: 'الانتقال للإعلان',
        },
        whatsappMessage: 'مرحباً، أحتاج مساعدة. الهاتف: {{phone}}',
        items: {
          market: {
            title: 'عروض السوبرماركت',
            description: 'خصومات كبيرة هذا الأسبوع على المواد الغذائية ومنتجات المنزل. لا تفوّت عروضنا لفترة محدودة!',
          },
          park: {
            title: 'فعالية حديقة المجمع',
            description: 'انضم إلينا في فعالية عائلية هذا الجمعة في حديقة المجمع. ألعاب وطعام ومرح للجميع!',
          },
          bmw: {
            title: 'موديلات BMW الجديدة',
            description: 'استكشف أحدث موديلات BMW بأداء وتصميم استثنائيين. احجز تجربة القيادة اليوم.',
          },
          'apple-vision': {
            title: 'تقنية وجديد',
            description: 'اختبر الجيل القادم من الحوسبة المكانية مع صور مذهلة وتطبيقات غامرة.',
          },
        },
      },
      payment: {
        title: 'الدفع',
        missingInfo: 'معلومات الدفع غير مكتملة. عُد إلى الفواتير.',
        chooseMethod: 'اختر طريقة الدفع:',
        methods: {
          card: 'بطاقة مصرفية',
          zain: 'زين كاش',
        },
        placeholders: {
          cardNumber: 'رقم البطاقة',
          month: 'شهر',
          year: 'سنة',
          cvv: 'CVV',
          phone: 'رقم الهاتف',
        },
        actions: {
          confirm: 'تأكيد الدفع',
          processing: 'جاري المعالجة...',
        },
        errors: {
          userNotLoggedIn: 'المستخدم غير مسجل الدخول',
          userNotFound: 'المستخدم غير موجود',
          billNotFound: 'لم يتم العثور على الفاتورة',
          failed: 'فشل الدفع',
        },
        success: 'تم الدفع بنجاح',
      },
      login: {
        title: 'مركز الفواتير',
        subtitle: 'مرحباً بعودتك! قم بإدارة فواتيرك وخدماتك بسهولة.',
        open: 'تسجيل الدخول',
        signIn: 'تسجيل الدخول',
        phoneLabel: 'رقم الهاتف',
        phonePlaceholder: 'ادخل رقم الهاتف',
        passwordLabel: 'كلمة المرور',
        passwordPlaceholder: 'ادخل كلمة المرور',
        rememberMe: 'تذكرني',
        successSignedIn: 'تم تسجيل الدخول بنجاح',
        errorPhoneRequired: 'يرجى إدخال رقم الهاتف',
        errorPasswordRequired: 'يرجى إدخال كلمة المرور',
        errorPhoneNotRegistered: 'رقم الهاتف غير مسجل',
        errorIncorrectPassword: 'كلمة المرور غير صحيحة',
        errorSigningIn: 'حدث خطأ أثناء تسجيل الدخول',
      },
    },
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: ((): 'en' | 'ar' => {
      try {
        const saved = localStorage.getItem('lang');
        return saved === 'ar' ? 'ar' : 'en';
      } catch {
        return 'en';
      }
    })(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
