// Language support: English is the default, with a button to switch to Arabic (and back).
// The choice is saved in localStorage ("pharmahub-lang"). Arabic also flips the page to right-to-left.
(function () {
  const STORAGE_KEY = "pharmahub-lang";

  // key: [English, Arabic]
  const D = {
    // ---- Page titles
    "title.default": ["PharmaHUB — Pharmacy Management System", "PharmaHUB — نظام إدارة الصيدلية"],
    "title.home": ["PharmaHUB — Your Online Pharmacy", "PharmaHUB — صيدليتك أونلاين"],
    "title.auth": ["Sign in — PharmaHUB", "تسجيل الدخول — PharmaHUB"],
    "title.shop": ["Shop Medicines — PharmaHUB", "تسوق الأدوية — PharmaHUB"],
    "title.cart": ["Your Cart — PharmaHUB", "سلة التسوق — PharmaHUB"],
    "title.orders": ["My Orders — PharmaHUB", "طلباتي — PharmaHUB"],
    "title.admin": ["Admin Dashboard — PharmaHUB", "لوحة تحكم المسؤول — PharmaHUB"],
    "title.help": ["Help — PharmaHUB", "مساعدة — PharmaHUB"],
    "title.unavailable": ["Request an Unavailable Medicine — PharmaHUB", "اطلب دواء غير متوفر — PharmaHUB"],
    "title.cheaper": ["Request a Medicine at a Lower Price — PharmaHUB", "اطلب دواء بسعر أرخص — PharmaHUB"],
    "title.notifications": ["Notifications — PharmaHUB", "الإشعارات — PharmaHUB"],

    // ---- Common
    "common.egp": ["EGP", "جنيه"],
    "common.cancel": ["Cancel", "إلغاء"],
    "common.total": ["Total", "الإجمالي"],
    "common.loading": ["Loading…", "جارٍ التحميل…"],
    "common.decrease": ["Decrease quantity", "إنقاص الكمية"],
    "common.increase": ["Increase quantity", "زيادة الكمية"],
    "common.all": ["All", "الكل"],
    "common.deletedMedicine": ["Deleted medicine", "دواء محذوف"],
    "common.sending": ["Sending…", "جارٍ الإرسال…"],
    "common.sendFailed": ["Could not send the request", "تعذر إرسال الطلب"],
    "common.goNotifications": ["Go to notifications", "الذهاب إلى الإشعارات"],
    "common.requestAnother": ["Request another medicine", "طلب دواء آخر"],
    "common.searchByName": ["Search medicines by name…", "ابحث عن دواء بالاسم…"],
    "common.noMedicines": ["No medicines found.", "لا توجد أدوية."],
    "common.goHome": ["Go home", "العودة للرئيسية"],
    "common.tryAgain": ["Try again", "حاول مرة أخرى"],

    // ---- Order statuses (0 Pending … 4 Canceled)
    "status.0": ["Pending", "قيد الانتظار"],
    "status.1": ["Delivering", "قيد التوصيل"],
    "status.2": ["Delivered", "تم التوصيل"],
    "status.3": ["Not Delivered", "لم يتم التوصيل"],
    "status.4": ["Canceled", "ملغي"],

    // ---- Header
    "nav.dashboard": ["Dashboard", "لوحة التحكم"],
    "nav.shop": ["Shop", "المتجر"],
    "nav.orders": ["My Orders", "طلباتي"],
    "nav.help": ["Help", "مساعدة"],
    "nav.notifications": ["Notifications", "الإشعارات"],
    "header.deleteAccount": ["Delete my account", "حذف حسابي"],
    "header.deleteAccountShort": ["Delete account", "حذف الحساب"],
    "header.whatsapp": ["Chat with us on WhatsApp", "تواصل معنا عبر واتساب"],
    "header.signout": ["Sign out", "تسجيل الخروج"],

    // ---- Delete account dialog
    "del.title": ["Delete your account?", "حذف حسابك؟"],
    "del.body": [
      "This permanently deletes your account, your profile and all your orders from the database. Orders that are still Pending or Delivering are canceled first and their stock is returned. This cannot be undone.",
      "سيؤدي ذلك إلى حذف حسابك وملفك الشخصي وجميع طلباتك نهائياً من قاعدة البيانات. يتم أولاً إلغاء الطلبات التي ما زالت قيد الانتظار أو قيد التوصيل وإرجاع كمياتها إلى المخزون. لا يمكن التراجع عن هذا الإجراء.",
    ],
    "del.typeConfirm": ['Type <span class="font-bold">DELETE</span> to confirm', 'اكتب <span class="font-bold">DELETE</span> للتأكيد'],
    "del.deleting": ["Deleting…", "جارٍ الحذف…"],
    "del.failed": ["Could not delete the account", "تعذر حذف الحساب"],

    // ---- 404 / error page
    "err404.title": ["Page not found", "الصفحة غير موجودة"],
    "err404.text": ["The page you're looking for doesn't exist or has been moved.", "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."],
    "errPage.title": ["This page didn't load", "تعذر تحميل هذه الصفحة"],
    "errPage.text": ["Something went wrong on our end. You can try refreshing or head back home.", "حدث خطأ من جانبنا. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية."],

    // ---- Landing page
    "home.f1.title": ["Easy ordering", "طلب سهل"],
    "home.f1.text": ["Browse categories, add medicines to your cart, and check out in seconds.", "تصفح الأقسام، وأضف الأدوية إلى سلتك، وأكمل طلبك في ثوانٍ."],
    "home.f2.title": ["Live order tracking", "تتبع الطلب مباشرة"],
    "home.f2.text": ["Follow every order from Pending to Delivered with real-time status updates.", "تابع كل طلب من قيد الانتظار حتى التوصيل مع تحديثات فورية للحالة."],
    "home.f3.title": ["Managed by professionals", "بإدارة متخصصين"],
    "home.f3.text": ["Stock, prices, and orders are managed by licensed pharmacy administrators.", "يدير المخزون والأسعار والطلبات صيادلة مرخّصون."],
    "home.heroA": ["Your pharmacy,", "صيدليتك"],
    "home.heroB": ["one click away", "على بُعد نقرة واحدة"],
    "home.sub": ["Browse medicine categories, place orders, and track every delivery — all in one place.", "تصفح أقسام الأدوية، واطلب ما تحتاجه، وتابع كل عملية توصيل — كل ذلك في مكان واحد."],
    "home.getStarted": ["Get started", "ابدأ الآن"],

    // ---- Sign in / Register
    "auth.signin": ["Sign in", "تسجيل الدخول"],
    "auth.register": ["Register", "إنشاء حساب"],
    "auth.noAdminRole": ["This account does not have the Admin role.", "هذا الحساب ليس لديه صلاحية المسؤول."],
    "auth.noUserRole": ["This account does not have the Normal User role.", "هذا الحساب ليس لديه صلاحية المستخدم العادي."],
    "auth.signinFailed": ["Sign in failed", "فشل تسجيل الدخول"],
    "auth.userExists": ["This user already exists.", "هذا المستخدم موجود بالفعل."],
    "auth.createdAdmin": [
      "Account created! Check your email to confirm your account, then sign in. Your admin request will wait for an admin to accept it.",
      "تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد حسابك، ثم سجّل الدخول. سينتظر طلبك لتصبح مسؤولاً موافقة أحد المسؤولين.",
    ],
    "auth.created": ["Account created! Check your email to confirm your account, then sign in.", "تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد حسابك، ثم سجّل الدخول."],
    "auth.signupFailed": ["Sign up failed", "فشل إنشاء الحساب"],
    "auth.pendingTitle": ["Waiting for admin approval", "في انتظار موافقة المسؤول"],
    "auth.rejectedTitle": ["Admin request refused", "تم رفض طلب المسؤول"],
    "auth.pendingText": [
      "Your request to become an admin was sent. An admin needs to accept it before you can sign in. Please check again later.",
      "تم إرسال طلبك لتصبح مسؤولاً. يجب أن يوافق عليه أحد المسؤولين قبل أن تتمكن من تسجيل الدخول. يرجى التحقق مرة أخرى لاحقاً.",
    ],
    "auth.rejectedText": [
      "An admin refused your request to become an admin, so you can't sign in as an admin with this account.",
      "رفض أحد المسؤولين طلبك لتصبح مسؤولاً، لذلك لا يمكنك تسجيل الدخول كمسؤول بهذا الحساب.",
    ],
    "auth.checking": ["Checking…", "جارٍ التحقق…"],
    "auth.checkAgain": ["Check again", "تحقق مرة أخرى"],
    "auth.backToSignin": ["Back to sign in", "العودة لتسجيل الدخول"],
    "auth.subLogin": ["Sign in to your account", "سجّل الدخول إلى حسابك"],
    "auth.subSignup": ["Create your account", "أنشئ حسابك"],
    "auth.signinAs": ["Sign in as", "تسجيل الدخول كـ"],
    "auth.registerAs": ["Register as", "التسجيل كـ"],
    "role.user": ["Normal User", "مستخدم عادي"],
    "role.admin": ["Admin", "مسؤول"],
    "auth.adminNote": ["Admin accounts need to be accepted by an existing admin before you can sign in.", "يجب أن يوافق مسؤول حالي على حسابات المسؤولين قبل أن تتمكن من تسجيل الدخول."],
    "auth.fullName": ["Full name", "الاسم الكامل"],
    "auth.phone": ["Phone", "رقم الهاتف"],
    "auth.email": ["Email", "البريد الإلكتروني"],
    "auth.password": ["Password", "كلمة المرور"],
    "auth.wait": ["Please wait…", "يرجى الانتظار…"],
    "auth.createAccount": ["Create account", "إنشاء الحساب"],
    "auth.noAccount": ["No account?", "ليس لديك حساب؟"],
    "auth.registerHere": ["Register here", "سجّل من هنا"],

    // ---- Shop
    "shop.inCart": ["{n} in cart", "{n} في السلة"],
    "shop.added": ["Added ✓", "تمت الإضافة ✓"],
    "shop.addToCart": ["Add to cart", "أضف إلى السلة"],
    "shop.inStock": ["{n} in stock", "{n} متوفر"],
    "shop.outOfStock": ["Out of stock", "نفد من المخزون"],
    "shop.title": ["Browse Medicines", "تصفح الأدوية"],
    "shop.loading": ["Loading medicines…", "جارٍ تحميل الأدوية…"],

    // ---- Cart
    "cart.needAddress": ["Please enter your delivery address.", "الرجاء إدخال عنوان التوصيل."],
    "cart.failed": ["Could not place the order", "تعذر إتمام الطلب"],
    "cart.empty": ["Your cart is empty.", "سلتك فارغة."],
    "cart.browse": ["Browse medicines", "تصفح الأدوية"],
    "cart.each": ["{p} each", "{p} للوحدة"],
    "cart.address": ["Delivery address", "عنوان التوصيل"],
    "cart.addressPh": ["Street, city, building, apartment…", "الشارع، المدينة، المبنى، الشقة…"],
    "cart.placing": ["Placing order…", "جارٍ إرسال الطلب…"],
    "cart.place": ["Place order", "إتمام الطلب"],
    "cart.title": ["Your Cart", "سلة التسوق"],

    // ---- My orders
    "orders.loading": ["Loading orders…", "جارٍ تحميل الطلبات…"],
    "orders.none": ["You haven't placed any orders yet.", "لم تقم بأي طلبات بعد."],
    "orders.order": ["Order #{id}", "طلب رقم #{id}"],
    "orders.canceling": ["Canceling…", "جارٍ الإلغاء…"],
    "orders.cancel": ["Cancel order", "إلغاء الطلب"],
    "orders.confirmCancel": ["Cancel order #{id}? The items will be returned to stock.", "هل تريد إلغاء الطلب رقم #{id}؟ سيتم إرجاع المنتجات إلى المخزون."],
    "orders.cancelFailed": ["Could not cancel the order", "تعذر إلغاء الطلب"],
    "orders.title": ["My Orders", "طلباتي"],

    // ---- Help
    "help.soon": ["Soon", "قريباً"],
    "help.heroA": ["Your health matters to us..", "صحتك تهمنا.."],
    "help.heroB": ["Special assistance & unavailable medicines service", "خدمة المساعدات الخاصة والأدوية غير المتوفرة"],
    "help.opt1": ["Request an unavailable medicine", "اطلب دواء غير متوفر"],
    "help.opt2": ["Request a medicine at a lower price", "اطلب دواء بسعر أرخص"],
    "help.opt3": ["Submit a medical assistance request", "تقديم طلب مساعدة علاجية"],
    "help.imgAlt": ["PharmaHUB team", "فريق PharmaHUB"],
    "help.how": ["How can we help?", "كيف نساعدك؟"],
    "help.intro": [
      "At PharmaHUB we believe medicine is a right for everyone. We designed these services so you can get the treatment you need easily and at the best price. Our team follows up on every request and replies to you on the notifications page.",
      "نؤمن في PharmaHUB أن الدواء حق للجميع. صمّمنا لك هذه الخدمات لتصل إلى ما تحتاجه من علاج بسهولة وبأفضل سعر، ويتابع فريقنا كل طلب ويرد عليك في صفحة الإشعارات.",
    ],
    "help.opt1Text": [
      "Type the name of the medicine you're looking for. If it isn't in the shop or is out of stock, you can send a request to the admins, and we'll notify you as soon as it's available.",
      "اكتب اسم الدواء الذي تبحث عنه. إذا كان غير موجود في المتجر أو نفد مخزونه يمكنك إرسال طلب للإدارة، وسنرسل لك إشعاراً فور توفره.",
    ],
    "help.opt2Text": [
      "Choose any available medicine and we'll show you its original price and the price after a 30% discount. Send your request for our team to review; once approved, you can order the medicine at the discounted price and choose the quantity you need (up to 5 units).",
      "اختر أي دواء متوفر وسنعرض لك سعره الأصلي والسعر بعد خصم 30%. أرسل طلبك ليراجعه فريقنا، وعند الموافقة تستطيع طلب الدواء بالسعر المخفض وتحديد الكمية التي تحتاجها (حتى 5 وحدات).",
    ],
    "help.opt3Text": [
      "Tap to open a WhatsApp chat with our team and choose the type of assistance: surgical assistance or expensive treatment. We'll ask you for the needed details (such as the type of operation, or the medicine name, its cost and your phone number). Once you send them, we confirm we received your request and our team contacts you as soon as possible.",
      "اضغط لفتح محادثة واتساب مع فريقنا واختر نوع المساعدة: مساعدة جراحية أو علاج مرتفع التكلفة. سنطلب منك التفاصيل اللازمة (مثل نوع العملية أو اسم الدواء وتكلفته ورقم هاتفك)، وبعد إرسالها نؤكد لك استلام طلبك ثم يتواصل معك فريقنا في أقرب وقت.",
    ],
    "help.start": ["Start now →", "ابدأ الآن ←"],
    "help.openWa": ["Open WhatsApp →", "افتح واتساب ←"],
    "help.back": ["← Back to help", "→ العودة إلى المساعدة"],

    // ---- Request an unavailable medicine
    "unav.typeMore": ["Type the medicine name (at least 2 letters) so we can check if it's available.", "اكتب اسم الدواء (حرفان على الأقل) لنتحقق من توفره."],
    "unav.inStock": ["This medicine is currently available in the shop", "هذا الدواء متوفر حالياً في المتجر"],
    "unav.inStockText": ["It can't be requested as an unavailable medicine — you can order it directly from the shop.", "لا يمكن طلبه كدواء غير متوفر، يمكنك طلبه مباشرةً من المتجر."],
    "unav.goShop": ["Go to the shop →", "اذهب إلى المتجر ←"],
    "unav.zeroStock": ["This medicine is in the shop but currently unavailable (stock 0)", "هذا الدواء موجود في المتجر لكنه غير متوفر حالياً (المخزون 0)"],
    "unav.notFound": ["We couldn't find this medicine in the shop", "لم نجد هذا الدواء في المتجر"],
    "unav.canRequest": ["You can send a request to the admins, and we'll notify you as soon as it's available.", "يمكنك إرسال طلب للإدارة، وسنرسل لك إشعاراً فور توفره."],
    "unav.similar": ["Available medicines with similar names:", "أدوية متوفرة بأسماء مشابهة:"],
    "unav.send": ["Send request to admins", "إرسال الطلب للإدارة"],
    "unav.sent": ["Your request was sent to the admins", "تم إرسال طلبك للإدارة"],
    "unav.sentText": ["We'll notify you on the notifications page as soon as the medicine is available.", "سنرسل لك إشعاراً في صفحة الإشعارات فور توفر الدواء."],
    "unav.name": ["Medicine name", "اسم الدواء"],
    "unav.namePh": ["Type the name of the medicine you're looking for…", "اكتب اسم الدواء الذي تبحث عنه…"],
    "unav.sub": [
      "Type the medicine name and we'll check if it's available. If it isn't, send your request and we'll let you know as soon as it is.",
      "اكتب اسم الدواء وسنتحقق إن كان متوفراً. وإن لم يكن، أرسل طلبك وسنبلغك فور توفره.",
    ],

    // ---- Request a medicine at a lower price
    "ch.sent": ["Your request was sent successfully", "تم إرسال طلبك بنجاح"],
    "ch.sentText": ["An admin will review your request, and you'll get the reply on the notifications page.", "سيقوم أحد المسؤولين بمراجعة طلبك، وسيصلك الرد في صفحة الإشعارات."],
    "ch.pick": ["Choose a medicine from the list to see its original price and the price after the discount.", "اختر دواءً من القائمة لعرض سعره الأصلي والسعر بعد الخصم."],
    "ch.original": ["Original price", "السعر الأصلي"],
    "ch.discount": ["Discount", "الخصم"],
    "ch.after": ["Price after discount", "السعر بعد الخصم"],
    "ch.orderNow": ["Order now", "اطلب الآن"],
    "ch.sub": [
      "Choose a medicine and we'll show you its price after a {d}% discount, then send your request for our team to review.",
      "اختر الدواء وسنعرض لك سعره بعد خصم {d}%، ثم أرسل طلبك ليراجعه فريقنا.",
    ],
    "ch.noMatch": ["No matching medicines.", "لا توجد أدوية مطابقة."],
    "ch.available": ["Available", "متوفر"],
    "ch.unavailable": ["Unavailable", "غير متوفر"],

    // ---- Notifications
    "notif.shopNow": ["Shop now →", "تسوّق الآن ←"],
    "notif.ordered": ["✓ This medicine was ordered at the discounted price", "✓ تم طلب هذا الدواء بالسعر بعد الخصم"],
    "notif.viewOrders": ["View my orders", "عرض طلباتي"],
    "notif.unavailable": ["This medicine is currently unavailable, so it can't be ordered now.", "هذا الدواء غير متوفر حالياً، لا يمكن طلبه الآن."],
    "notif.unitPrice": ["Unit price after discount", "سعر الوحدة بعد الخصم"],
    "notif.qty": ["Quantity", "الكمية"],
    "notif.maxNote": [
      "Maximum {max} units (based on available stock, up to {limit} units per order).",
      "الحد الأقصى {max} وحدات (بحسب المتاح في المخزون وبحد أقصى {limit} وحدات للطلب الواحد).",
    ],
    "notif.placing": ["Sending order…", "جارٍ إرسال الطلب…"],
    "notif.orderBtn": ["Order at the discounted price (total {total})", "اطلب الدواء بسعر الخصم (الإجمالي {total})"],
    "notif.none": ["No notifications yet.", "لا توجد إشعارات حتى الآن."],
    "notif.new": ["New", "جديد"],
    "notif.title": ["Notifications", "الإشعارات"],
    "notif.approvedTitle": ["Your request was approved", "تمت الموافقة على طلبك"],
    "notif.approvedMsg": [
      'We approved your request for "{name}". You can now order it at the discounted price of {new} instead of {old}.',
      'وافقنا على طلبك للدواء "{name}". يمكنك الآن طلبه بالسعر بعد الخصم {new} بدلاً من {old}.',
    ],
    "notif.rejectedTitle": ["Sorry about your request", "نعتذر عن طلبك"],
    "notif.rejectedMsg": [
      'Sorry, we can\'t offer "{name}" at a discounted price right now. Stay tuned — we\'ll let you know as soon as new offers are available.',
      'نأسف، لا يمكننا توفير الدواء "{name}" بسعر مخفض في الوقت الحالي. ابقَ على اطلاع، وسنخبرك فور توفر عروض جديدة.',
    ],
    "notif.availableTitle": ["The medicine you requested is now available", "الدواء الذي طلبته أصبح متوفراً"],
    "notif.availableMsg": ['"{name}" is now available in the shop. You can order it now.', 'الدواء "{name}" أصبح متوفراً الآن في المتجر. يمكنك طلبه الآن.'],

    // ---- Admin dashboard
    "admin.title": ["Admin Dashboard", "لوحة تحكم المسؤول"],
    "admin.tab.orders": ["Orders", "الطلبات"],
    "admin.tab.medicines": ["Medicines", "الأدوية"],
    "admin.tab.categories": ["Categories", "الأقسام"],
    "admin.tab.users": ["Users", "المستخدمون"],
    "admin.tab.requests": ["Requests", "طلبات الإدارة"],
    "admin.tab.discounts": ["Discount Requests", "طلبات الخصم"],
    "admin.tab.medreqs": ["Medicine Requests", "طلبات الأدوية"],
    "admin.tab.assist": ["Assistance Requests", "طلبات المساعدة"],
    "admin.customer": ["Customer", "العميل"],
    "admin.phone": ["Phone", "الهاتف"],
    "admin.email": ["Email", "البريد الإلكتروني"],
    "admin.address": ["Address", "العنوان"],
    "admin.noOrders": ["No orders yet.", "لا توجد طلبات بعد."],
    "admin.canceledLocked": ["A canceled order cannot be changed", "لا يمكن تغيير طلب ملغي"],
    "admin.name": ["Name", "الاسم"],
    "admin.category": ["Category", "القسم"],
    "admin.price": ["Price", "السعر"],
    "admin.stock": ["Stock", "المخزون"],
    "admin.confirmDelMed": ["Delete this medicine?", "هل تريد حذف هذا الدواء؟"],
    "admin.editMed": ["Edit medicine", "تعديل الدواء"],
    "admin.addMed": ["Add medicine", "إضافة دواء"],
    "admin.description": ["Description", "الوصف"],
    "admin.selectCat": ["Select category…", "اختر القسم…"],
    "admin.imageUrl": ["Image URL", "رابط الصورة"],
    "admin.save": ["Save changes", "حفظ التغييرات"],
    "admin.cancelEdit": ["Cancel editing", "إلغاء التعديل"],
    "admin.newCat": ["New category name", "اسم القسم الجديد"],
    "admin.add": ["Add", "إضافة"],
    "admin.confirmDelCat": ["Delete this category and all its medicines?", "هل تريد حذف هذا القسم وجميع أدويته؟"],
    "admin.joined": ["Joined", "تاريخ الانضمام"],
    "admin.role": ["Role", "الصلاحية"],
    "admin.mainAdmin": ["Main admin (protected)", "المسؤول الرئيسي (محمي)"],
    "admin.removeAdmin": ["Remove admin", "إزالة صلاحية المسؤول"],
    "admin.makeAdmin": ["Make admin", "تعيين كمسؤول"],
    "admin.cantRemoveSelf": ["You can't remove the admin role from your own account.", "لا يمكنك إزالة صلاحية المسؤول من حسابك."],
    "admin.loadingReqs": ["Loading requests…", "جارٍ تحميل الطلبات…"],
    "admin.st.pending": ["Pending", "قيد الانتظار"],
    "admin.st.accepted": ["Accepted", "مقبول"],
    "admin.st.refused": ["Refused", "مرفوض"],
    "admin.st.ordered": ["Ordered", "تم الطلب"],
    "admin.noAdminReqs": ["No admin requests.", "لا توجد طلبات إدارة."],
    "admin.requested": ["Requested", "تاريخ الطلب"],
    "admin.status": ["Status", "الحالة"],
    "admin.accept": ["Accept", "قبول"],
    "admin.ignore": ["Ignore", "تجاهل"],
    "admin.refuse": ["Refuse", "رفض"],
    "admin.noDiscounts": ["No discount requests.", "لا توجد طلبات خصم."],
    "admin.medicine": ["Medicine", "الدواء"],
    "admin.original": ["Original", "السعر الأصلي"],
    "admin.after30": ["After 30%", "بعد خصم 30%"],
    "admin.noMedReqs": ["No medicine requests.", "لا توجد طلبات أدوية."],
    "admin.medReqsNote": [
      "When you add the medicine or raise its stock above 0, everyone who requested it is notified automatically.",
      "عند إضافة الدواء أو رفع مخزونه فوق 0، يتم إشعار كل من طلبه تلقائياً.",
    ],
    "admin.requestedMed": ["Requested medicine", "الدواء المطلوب"],
    "admin.waiting": ["Waiting", "في الانتظار"],
    "admin.notified": ["Notified", "تم الإشعار"],
    "admin.typeSurgical": ["Surgical assistance", "مساعدة جراحية"],
    "admin.typeTreatment": ["Expensive medical treatment", "علاج مرتفع التكلفة"],
    "admin.stAwaiting": ["Waiting for details", "في انتظار التفاصيل"],
    "admin.stSubmitted": ["Details received", "تم استلام التفاصيل"],
    "admin.stCancelled": ["Cancelled", "ملغي"],
    "admin.noAssist": ["No assistance requests yet.", "لا توجد طلبات مساعدة بعد."],
    "admin.assistNote": [
      "Requests sent by users through the WhatsApp assistance chat. The chatbot asks for the details and confirms automatically.",
      "طلبات أرسلها المستخدمون عبر محادثة المساعدة على واتساب. يطلب الروبوت التفاصيل ويؤكد الاستلام تلقائياً.",
    ],
    "admin.received": ["Received", "تاريخ الاستلام"],
    "admin.whatsapp": ["WhatsApp", "واتساب"],
    "admin.type": ["Type", "النوع"],
    "admin.details": ["Details", "التفاصيل"],

    // ---- Messages that come from the database (both languages are listed so either one is translated)
    "err.notAuth": ["Not authenticated", "لم يتم تسجيل الدخول"],
    "err.onlyAdmins": ["Only admins can do this", "هذا الإجراء متاح للمسؤولين فقط"],
    "err.emptyOrder": ["Order must contain at least one item", "يجب أن يحتوي الطلب على منتج واحد على الأقل"],
    "err.orderNotFound": ["Order not found", "لم يتم العثور على الطلب"],
    "err.cantCancel": ["This order can no longer be canceled", "لم يعد من الممكن إلغاء هذا الطلب"],
    "err.adminNoDelete": ["Admin accounts cannot be deleted from here", "لا يمكن حذف حسابات المسؤولين من هنا"],
    "err.mainAdmin": ["The main admin cannot be removed", "لا يمكن إزالة المسؤول الرئيسي"],
    "err.reqNotFound": ["Request not found", "الطلب غير موجود"],
    "err.handled": ["This request was already handled", "تم التعامل مع هذا الطلب بالفعل"],
    "err.nameLong": ["The medicine name is too long", "اسم الدواء طويل جداً"],
    "err.medNotFound": ["Medicine not found", "الدواء غير موجود"],
    "err.needAddress": ["Please enter the delivery address", "الرجاء إدخال عنوان التوصيل"],
    "err.needName": ["Please type the medicine name", "الرجاء كتابة اسم الدواء"],
    "err.qtyMin": ["Quantity must be at least 1", "الكمية يجب ألا تقل عن 1"],
    "err.alreadyOrdered": ["This medicine has already been ordered", "تم طلب هذا الدواء بالفعل"],
    "err.openDiscount": ["You already have a pending request for this medicine", "لديك طلب سابق لهذا الدواء لم يتم حسمه بعد"],
    "err.alreadyRequested": ["You already requested this medicine — we'll notify you as soon as it's available", "لقد طلبت هذا الدواء من قبل، وسنبلغك فور توفره"],
    "err.notApproved": ["This request has not been approved", "لم تتم الموافقة على هذا الطلب"],
    "err.medUnavailable": ["This medicine is currently unavailable", "هذا الدواء غير متوفر حالياً"],
    "err.medGone": ["This medicine no longer exists", "هذا الدواء لم يعد موجوداً"],
    "err.medIdNotFound": ["Medicine {1} not found", "الدواء {1} غير موجود"],
    "err.stock": ["Insufficient stock for medicine {1}", "الكمية غير كافية في المخزون للدواء {1}"],
    "err.maxDiscount": ["The maximum for a discounted order is {1} units", "الحد الأقصى للطلب المخفض هو {1} وحدات"],
    "err.onlyN": ["Only {1} units are available in stock", "المتاح في المخزون {1} وحدة فقط"],
    "err.invalidLogin": ["Invalid login credentials", "بيانات الدخول غير صحيحة"],
    "err.emailNotConfirmed": ["Email not confirmed", "لم يتم تأكيد البريد الإلكتروني بعد"],
    "err.pwShort": ["Password should be at least {1} characters.", "يجب ألا تقل كلمة المرور عن {1} أحرف."],
    "err.rateLimit": ["Too many emails were sent. Please try again later.", "تم إرسال عدد كبير من الرسائل. يرجى المحاولة لاحقاً."],
    "err.invalidEmail": ["Unable to validate email address: invalid format", "صيغة البريد الإلكتروني غير صحيحة"],
  };

  // Messages with a number/name inside them
  const PATTERNS = [
    [/^Medicine (.+) not found$/, "err.medIdNotFound"],
    [/^الدواء (.+) غير موجود$/, "err.medIdNotFound"],
    [/^Insufficient stock for medicine (.+)$/, "err.stock"],
    [/^الحد الأقصى للطلب المخفض هو (\d+) وحدات$/, "err.maxDiscount"],
    [/^المتاح في المخزون (\d+) وحدة فقط$/, "err.onlyN"],
    [/^Password should be at least (\d+) characters/i, "err.pwShort"],
    [/rate limit exceeded/i, "err.rateLimit"],
    [/^Unable to validate email address/i, "err.invalidEmail"],
  ];

  let lang = "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") lang = saved;
  } catch (e) { /* storage blocked: stay in English */ }

  function applyDocumentLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }
  applyDocumentLang();

  Object.defineProperty(window, "LANG", { get: () => lang, configurable: true });

  function fill(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  }

  // tr("key", { n: 3 }) -> text in the current language
  window.tr = function (key, vars) {
    const entry = D[key];
    if (!entry) return key;
    return fill(entry[lang === "ar" ? 1 : 0] || entry[0], vars);
  };

  // Any known sentence (English or Arabic) -> its key, so saved messages follow the current language
  const REVERSE = {};
  Object.keys(D).forEach((k) => {
    if (D[k][0].indexOf("{") !== -1) return;
    REVERSE[D[k][0]] = k;
    REVERSE[D[k][1]] = k;
  });

  // Translate a message that may come from the database / sign-in service (unknown messages are shown as-is)
  window.tErr = function (msg) {
    if (msg == null || msg === "") return msg;
    const m = String(msg).trim();
    if (REVERSE[m]) return window.tr(REVERSE[m]);
    for (const [re, key] of PATTERNS) {
      const hit = m.match(re);
      if (hit) return window.tr(key, { 1: hit[1] });
    }
    return m;
  };

  window.money = function (n) {
    return Number(n).toFixed(2) + " " + window.tr("common.egp");
  };
  window.fmtDate = function (d) {
    return new Date(d).toLocaleString(lang === "ar" ? "ar-EG" : undefined);
  };
  window.fmtDay = function (d) {
    return new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : undefined);
  };

  // The language button: shows "العربية" while in English, and "English" while in Arabic
  window.langToggleHtml = function () {
    const toArabic = lang !== "ar";
    return (
      '<button type="button" data-action="toggle-lang" lang="' + (toArabic ? "ar" : "en") + '" title="' +
        (toArabic ? "التبديل إلى العربية" : "Switch to English") +
        '" class="flex items-center gap-1 rounded-full border border-input bg-background px-3 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted">' +
        window.icon("Languages", "h-4 w-4") + "<span>" + (toArabic ? "العربية" : "English") + "</span>" +
      "</button>"
    );
  };

  window.setLang = function (next) {
    lang = next === "ar" ? "ar" : "en";
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    applyDocumentLang();
    if (typeof window.onLangChange === "function") window.onLangChange();
  };

  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-action="toggle-lang"]')) window.setLang(lang === "ar" ? "en" : "ar");
  });
})();
