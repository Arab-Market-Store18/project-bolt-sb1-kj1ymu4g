// المسار: lib/data/categories.ts

// --- تعريف أنواع البيانات وتصديرها ---

// تم تعديل هذا النوع ليكون سلسلة نصية بسيطة لكسر الاعتماد الدائري.
export type IconName = string;

export interface SubCategory {
  id: string;
  name: string;
  icon: IconName;
  // هذا السطر يتيح لك إضافة أقسام فرعية متداخلة
  subCategories?: SubCategory[]; 
}

export interface MainCategory {
  id: string;
  name: string;
  icon: IconName;
  subCategories: SubCategory[];
}

// --- مصدر البيانات الوحيد وتصديره (لم يتغير) ---
export const categoriesData: MainCategory[] = [
    {
      id: 'fashion_clothing', name: 'الملابس والأزياء', icon: 'Shirt',
      subCategories: [
        { 
          id: 'men_clothing', name: 'ملابس رجالي', icon: 'Tshirt',
          subCategories: [
            {
              id: 'men_shirts', name: 'قمصان', icon: 'Shirt',
              subCategories: [
                { id: 'formal_shirts', name: 'القمصان الكلاسيكية', icon: 'Tag' },
                { id: 'casual_shirts', name: 'قمصان الكاجوال', icon: 'Tag' },
                { id: 'polo_shirts', name: 'القمصان الرياضية', icon: 'Tag' },
              ]
            },
            {
              id: 'men_pants', name: 'بناطيل', icon: 'Pants',
              subCategories: [
                { id: 'trousers', name: 'البنطلون الكلاسيكي', icon: 'Tag' },
                { id: 'jeans', name: 'الجينز', icon: 'Tag' },
                { id: 'chinos', name: 'الشينو', icon: 'Tag' },
                { id: 'joggers', name: 'البنطلون الرياضي', icon: 'Tag' },
              ]
            },
            {
              id: 'men_suits', name: 'البدل الرسمية', icon: 'Suitcase',
              subCategories: [
                { id: 'business_suits', name: 'بدلة العمل', icon: 'Tag' },
                { id: 'tuxedos', name: 'بدلة السهرة', icon: 'Tag' },
              ]
            },
            {
              id: 'men_outerwear', name: 'الملابس الخارجية', icon: 'Jacket',
              subCategories: [
                { id: 'leather_jackets', name: 'الجاكيت الجلدي', icon: 'Tag' },
                { id: 'bomber_jackets', name: 'الجاكيت الرياضي', icon: 'Tag' },
                { id: 'coats', name: 'المعاطف', icon: 'Tag' },
              ]
            },
            {
              id: 'men_underwears', name: 'الملابس الداخلية وملابس النوم', icon: 'Underwear',
              subCategories: [
                { id: 'underwear', name: 'الملابس الداخلية', icon: 'Tag' },
                { id: 'pajamas', name: 'ملابس النوم', icon: 'Tag' },
              ]
            },
          ]
        },
        { id: 'women_clothing', name: 'ملابس حريمي', icon: 'Dress' },
        { id: 'children_clothing', name: 'ملابس أطفال', icon: 'Baby' },
        { id: 'footwear', name: 'أحذية', icon: 'Shoe' },
        { id: 'accessories', name: 'إكسسوارات', icon: 'Watch' },
        { id: 'tailoring_services', name: 'خدمات الخياطة والتفصيل', icon: 'Scissors' },
      ]
    },
    {
      id: 'food_restaurants', name: 'المأكولات والمطاعم', icon: 'UtensilsCrossed',
      subCategories: [
        { id: 'restaurant_types', name: 'أنواع المطاعم', icon: 'Store' },
        { id: 'food_ingredients', name: 'مكونات الأكل', icon: 'Salad' },
        { id: 'kitchen_tools', name: 'أدوات المطبخ', icon: 'CookingPot' },
        { id: 'delivery_services', name: 'خدمات التوصيل', icon: 'Package' },
        { id: 'groceries', name: 'مواد غذائية', icon: 'ShoppingBasket' },
        { id: 'beverages', name: 'مشروبات', icon: 'GlassWater' },
        { id: 'healthy_food', name: 'أطعمة صحية', icon: 'Salad' },
        { id: 'sweets', name: 'حلويات', icon: 'CakeSlice' },
      ]
    },
    {
      id: 'tech_electronics', name: 'الإلكترونيات والتكنولوجيا', icon: 'Laptop',
      subCategories: [
        { id: 'smartphones', name: 'الموبايلات الذكية', icon: 'Smartphone' },
        { id: 'computers', name: 'أجهزة الكمبيوتر', icon: 'Computer' },
        { id: 'accessories', name: 'ملحقات', icon: 'Headphones' },
        { id: 'home_appliances', name: 'أجهزة منزلية', icon: 'Refrigerator' },
        { id: 'gaming', name: 'ألعاب إلكترونية', icon: 'Gamepad' },
        { id: 'software', name: 'برامج وتطبيقات', icon: 'Code' },
        { id: 'networks', name: 'شبكات وإنترنت', icon: 'Wifi' },
        { id: 'security_systems', name: 'أنظمة أمنية', icon: 'Camera' },
        { id: 'modern_tech', name: 'تقنيات حديثة', icon: 'Robot' },
      ]
    },
    {
      id: 'health_medical', name: 'الصحة والعلاج', icon: 'Stethoscope',
      subCategories: [
        { id: 'specialized_clinics', name: 'العيادات المتخصصة', icon: 'Hospital' },
        { id: 'medicines', name: 'الأدوية', icon: 'Pill' },
        { id: 'medical_devices', name: 'أجهزة طبية', icon: 'Thermometer' },
        { id: 'healthy_nutrition', name: 'التغذية الصحية', icon: 'Apple' },
        { id: 'hospitals', name: 'مستشفيات', icon: 'Hospital' },
        { id: 'medical_centers', name: 'مراكز طبية', icon: 'HeartPulse' },
        { id: 'elderly_care', name: 'منتجات العناية بالمسنين', icon: 'Users' },
        { id: 'alternative_medicine', name: 'الطب البديل', icon: 'Herbs' },
        { id: 'mental_health', name: 'العناية بالصحة النفسية', icon: 'Brain' },
        { id: 'first_aid', name: 'معدات الإسعافات الأولية', icon: 'FirstAid' },
      ]
    },
    {
      id: 'beauty_salons', name: 'التجميل والكوافير', icon: 'Heart',
      subCategories: [
        { id: 'skincare', name: 'العناية بالبشرة', icon: 'Sparkles' },
        { id: 'salons', name: 'صالونات وكوافيرات', icon: 'Scissors' },
        { id: 'perfumes', name: 'العطور', icon: 'SprayCan' },
        { id: 'makeup', name: 'مكياج', icon: 'PaintBrush' },
        { id: 'beauty_tools', name: 'أدوات التجميل', icon: 'Brush' },
        { id: 'hair_care', name: 'العناية بالشعر', icon: 'Wind' },
        { id: 'nail_care', name: 'العناية بالأظافر', icon: 'NailPolish' },
        { id: 'hair_removal', name: 'إزالة الشعر', icon: 'Zap' },
        { id: 'body_care', name: 'العناية بالجسم', icon: 'Hand' },
        { id: 'natural_products', name: 'منتجات طبيعية', icon: 'Leaf' },
      ]
    },
    {
      id: 'furniture_decor', name: 'الأثاث والمفروشات', icon: 'Sofa',
      subCategories: [
        { id: 'home_furniture', name: 'أثاث بيت', icon: 'Sofa' },
        { id: 'decorations', name: 'ديكورات وتحف', icon: 'Lamp' },
        { id: 'lighting', name: 'إضاءة', icon: 'Lightbulb' },
        { id: 'curtains_furnishings', name: 'ستائر ومفروشات', icon: 'Curtains' },
        { id: 'gardens', name: 'حدائق', icon: 'Tree' },
        { id: 'flooring', name: 'أرضيات', icon: 'Layout' },
        { id: 'kitchens', name: 'مطابخ', icon: 'CookingPot' },
        { id: 'installation_services', name: 'خدمات تركيب', icon: 'Tools' },
        { id: 'interior_designs', name: 'تصاميم داخلية', icon: 'Paintbrush' },
      ]
    },
    {
      id: 'cars', name: 'العربيات', icon: 'Car',
      subCategories: [
        { id: 'car_parts', name: 'قطع غيار عربيات', icon: 'Cog' },
        { id: 'car_services', name: 'خدمات العربيات', icon: 'Wrench' },
        { id: 'new_cars', name: 'سيارات جديدة', icon: 'Car' },
        { id: 'used_cars', name: 'سيارات مستعملة', icon: 'Car' },
        { id: 'car_rental', name: 'تأجير سيارات', icon: 'CarFront' },
        { id: 'roadside_assistance', name: 'خدمات الطرق', icon: 'Truck' },
        { id: 'motorcycles', name: 'دراجات نارية', icon: 'Motorcycle' },
        { id: 'car_insurance', name: 'تأمين سيارات', icon: 'ShieldCheck' },
        { id: 'licensing_services', name: 'خدمات ترخيص', icon: 'Clipboard' },
      ]
    },
    {
      id: 'real_estate', name: 'العقارات', icon: 'Building2',
      subCategories: [
        { id: 'for_sale', name: 'للبيع', icon: 'Home' },
        { id: 'for_rent', name: 'للإيجار', icon: 'Key' },
        { id: 'lands', name: 'أراضي', icon: 'Map' },
        { id: 'property_management', name: 'إدارة عقارية', icon: 'Building' },
        { id: 'real_estate_services', name: 'خدمات عقارية', icon: 'Handshake' },
        { id: 'villas', name: 'فلل وقصور', icon: 'Building' },
        { id: 'offices_stores', name: 'مكاتب ومحلات', icon: 'Store' },
        { id: 'chalets', name: 'شاليهات ومنتجعات', icon: 'Beach' },
        { id: 'legal_consulting', name: 'استشارات قانونية', icon: 'Scale' },
        { id: 'interior_design', name: 'تصميم داخلي', icon: 'Palette' },
      ]
    },
    {
      id: 'education_schools', name: 'التعليم والمدارس', icon: 'GraduationCap',
      subCategories: [
        { id: 'schools', name: 'مدارس', icon: 'School' },
        { id: 'universities', name: 'جامعات وكليات', icon: 'Building' },
        { id: 'training_courses', name: 'دورات تدريبية', icon: 'Book' },
        { id: 'educational_consulting', name: 'استشارات تعليمية', icon: 'Users' },
        { id: 'school_supplies', name: 'مستلزمات دراسية', icon: 'PenTool' },
        { id: 'distance_learning', name: 'تعليم عن بعد', icon: 'Monitor' },
        { id: 'institutes', name: 'معاهد', icon: 'Building' },
        { id: 'vocational_training', name: 'تدريب مهني', icon: 'Hammer' },
        { id: 'educational_programs', name: 'برامج تعليمية', icon: 'Puzzle' },
        { id: 'books_references', name: 'كتب ومراجع', icon: 'BookOpen' },
        { id: 'learning_activities', name: 'أنشطة تعليمية', icon: 'Pencil' },
      ]
    },
    {
      id: 'agriculture', name: 'الزراعة', icon: 'Tractor',
      subCategories: [
        { id: 'farm_equipment', name: 'معدات زراعية', icon: 'Tractor' },
        { id: 'plants_seeds', name: 'نباتات وزرع', icon: 'Leaf' },
        { id: 'agricultural_services', name: 'خدمات زراعية', icon: 'Sprout' },
      ]
    },
    {
      id: 'sports', name: 'الرياضة', icon: 'Dumbbell',
      subCategories: [
        { id: 'sportswear', name: 'ملابس رياضة', icon: 'Shirt' },
        { id: 'sports_equipment', name: 'معدات رياضية', icon: 'Dumbbell' },
        { id: 'sports_clubs', name: 'أندية رياضية', icon: 'Swords' },
        { id: 'events', name: 'بطولات وفعاليات', icon: 'Award' },
        { id: 'outdoor_games', name: 'ألعاب خارجية', icon: 'Tent' },
        { id: 'water_sports', name: 'ألعاب مائية', icon: 'Waves' },
        { id: 'indoor_games', name: 'ألعاب داخلية', icon: 'Gamepad' },
        { id: 'sport_supplies', name: 'مستلزمات رياضية', icon: 'Helmet' },
        { id: 'swimwear', name: 'ملابس سباحة', icon: 'Swim' },
      ]
    },
    {
      id: 'finance_banks', name: 'المال والبنوك', icon: 'Banknote',
      subCategories: [
        { id: 'banking_services', name: 'خدمات بنكية', icon: 'Banknote' },
        { id: 'investments', name: 'استثمارات', icon: 'TrendingUp' },
        { id: 'insurance', name: 'تأمين', icon: 'Shield' },
        { id: 'money_transfer', name: 'تحويل أموال', icon: 'ArrowRightLeft' },
        { id: 'financing', name: 'تمويل', icon: 'CreditCard' },
        { id: 'stock_market', name: 'بورصة', icon: 'LineChart' },
        { id: 'accounting', name: 'محاسبة', icon: 'Calculator' },
        { id: 'electronic_services', name: 'خدمات إلكترونية', icon: 'Zap' },
        { id: 'financial_consulting', name: 'استشارات مالية', icon: 'PiggyBank' },
        { id: 'small_projects', name: 'مشاريع صغيرة', icon: 'Briefcase' },
      ]
    },
    {
      id: 'travel_tourism', name: 'السياحة والسفر', icon: 'Plane',
      subCategories: [
        { id: 'reservations', name: 'حجوزات', icon: 'Ticket' },
        { id: 'tour_packages', name: 'جولات سياحية', icon: 'Map' },
        { id: 'hotels', name: 'فنادق', icon: 'Hotel' },
        { id: 'flights', name: 'طيران', icon: 'Plane' },
      ]
    },
    {
      id: 'industry_factories', name: 'الصناعة والمصانع', icon: 'Factory',
      subCategories: [
        { id: 'machinery_equipment', name: 'آلات ومعدات', icon: 'Cog' },
        { id: 'raw_materials', name: 'مواد خام', icon: 'Drill' },
        { id: 'industrial_services', name: 'خدمات صناعية', icon: 'Tools' },
      ]
    },
    {
      id: 'home_services', name: 'الخدمات المنزلية', icon: 'Home',
      subCategories: [
        { id: 'home_cleaning', name: 'تنظيف المنازل', icon: 'SprayCan' },
        { id: 'pest_control', name: 'مكافحة الحشرات', icon: 'Bug' },
        { id: 'furniture_moving', name: 'نقل الأثاث', icon: 'Truck' },
        { id: 'home_maintenance', name: 'صيانة منزلية', icon: 'Wrench' },
        { id: 'carpet_cleaning', name: 'تنظيف السجاد والمفروشات', icon: 'Vacuum' },
        { id: 'landscaping', name: 'خدمات تنسيق الحدائق', icon: 'Tree' },
      ]
    },
    {
      id: 'events_parties', name: 'خدمات المناسبات والحفلات', icon: 'PartyPopper',
      subCategories: [
        { id: 'party_planning', name: 'تخطيط الحفلات', icon: 'Calendar' },
        { id: 'equipment_rental', name: 'تأجير المعدات', icon: 'Chair' },
        { id: 'photography_services', name: 'خدمات التصوير', icon: 'Camera' },
        { id: 'flower_coordination', name: 'تنسيق الزهور', icon: 'Flower' },
        { id: 'hospitality_services', name: 'خدمات الضيافة', icon: 'Cookie' },
        { id: 'luxury_car_rental', name: 'تأجير السيارات الفاخرة', icon: 'Car' },
      ]
    },
    {
      id: 'pet_services', name: 'خدمات الحيوانات الأليفة', icon: 'PawPrint',
      subCategories: [
        { id: 'veterinary_clinics', name: 'عيادات بيطرية', icon: 'Bone' },
        { id: 'pet_supplies', name: 'مستلزمات الحيوانات', icon: 'Dog' },
        { id: 'grooming', name: 'تجميل وعناية', icon: 'SprayCan' },
        { id: 'pet_hotels', name: 'فنادق للحيوانات', icon: 'Building' },
        { id: 'pet_training', name: 'تدريب الحيوانات', icon: 'Book' },
        { id: 'adoption_services', name: 'خدمات تبني', icon: 'Heart' },
      ]
    },
];