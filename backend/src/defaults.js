const categories = [
  "Furniture",
  "Outdoor Furniture",
  "Hotel Bar Furniture",
  "Coffee Shop Furniture",
  "Cafe Furniture",
  "Restaurant Furniture",
  "Hotel Dining Furniture",
  "Banquet & Event Chairs"
];
const categoryTree = categories.map((name, index) => ({
  id: `category-${index + 1}`,
  name,
  children: []
}));
const categoryIdByName = new Map(categoryTree.map((category) => [category.name, category.id]));

const products = [
  ["Nerd wooden chair", "img/ref-furniture-01.webp", 599, 799, "Vitra", ["Black", "Blue", "Gray", "Yellow"], "-25%"],
  ["Panton Junior Chair", "img/ref-furniture-02.jpg", 199, null, "HAY", ["Black", "Blue", "Gray", "Green"], "New"],
  ["Wooden naïve chair", "img/ref-furniture-03.webp", 119, null, "Alessi", ["Beige", "Gray", "Green"], ""],
  ["Eames lounge chair", "img/ref-furniture-04.webp", 399, 799, "Vitra", ["Black", "Gray"], "-50%"],
  ["Wooden single drawer", "img/ref-furniture-05.jpg", 249, null, "Louis Poulsen", ["Blue", "Brown", "Yellow"], ""],
  ["Eames Plastic Side Chair", "img/ref-furniture-06.jpg", 99, null, "Vitra", ["Beige", "Black", "Blue"], "New"],
  ["Chair with love", "img/ref-furniture-07.webp", 420, null, "Magisso", ["Beige", "Brown", "Green"], ""],
  ["Classic wooden chair", "img/ref-furniture-08.webp", 149, 199, "HAY", ["Black", "Brown", "Gray"], "Sale"],
  ["Reflect Chest of Drawers", "img/ref-furniture-09.jpg", 399, null, "Eva Solo", ["Beige", "Brown", "Yellow"], ""],
  ["Chair with Magazine", "img/ref-furniture-10.webp", 249, null, "Vitra", ["Black", "Blue", "Green"], ""],
  ["Euismod aliquam parturient", "img/ref-furniture-11.jpg", 599, null, "Joseph Joseph", ["Black", "Gray", "Green", "Red"], ""],
  ["Facilisis ligula aliquet", "img/ref-furniture-12.jpg", 199, null, "PackIt", ["Beige", "Blue", "Brown"], ""],
  ["Outdoor teak lounge chair", "img/outdoor.jpeg", 649, null, "Home Shape", ["Natural Oak"], "New", "Outdoor Furniture"],
  ["Hotel bar stool", "img/furniture5-700x800.jpg", 329, null, "Home Shape", ["Black", "Brown"], "", "Hotel Bar Furniture"],
  ["Coffee shop dining chair", "img/coffee.jpeg", 229, null, "Home Shape", ["Oak", "Black"], "", "Coffee Shop Furniture"],
  ["Cafe terrace chair", "img/furniture10-700x800.jpg.webp", 189, null, "Home Shape", ["Natural Oak"], "", "Cafe Furniture"],
  ["Restaurant dining chair", "img/restrurent.jpeg", 279, null, "Home Shape", ["Walnut", "Black"], "", "Restaurant Furniture"],
  ["Hotel dining table", "img/furniture.jpg", 899, null, "Home Shape", ["Walnut"], "New", "Hotel Dining Furniture"],
  ["Banquet event chair", "img/Banquet%20%26%20Event%20Chairs.jpeg", 159, null, "Home Shape", ["Black", "Gray"], "", "Banquet & Event Chairs"]
].map(([name, image, price, oldPrice, brand, colors, badge, category], index) => ({
  id: index + 1,
  name,
  category: category || "Furniture",
  categoryId: categoryIdByName.get(category || "Furniture"),
  image,
  hoverImage: index < 12 ? image.replace(/(\.[^.]+)$/, "-hover$1") : image,
  price,
  oldPrice,
  brand,
  colors,
  badge,
  active: true,
  collections: index < 4 ? ["Best Sellers", "Featured"] : index < 12 ? ["Featured"] : ["Catalog"],
  description: "Thoughtfully made furniture with a considered silhouette and lasting everyday comfort.",
  detailHeading: index === 0 ? "Designed for modern living" : "",
  features: index === 0 ? [
    "Minimalist aesthetic that fits any space.",
    "Ergonomically shaped for maximum support.",
    "Lightweight yet incredibly sturdy construction.",
    "Available in curated contemporary finishes.",
    "Sustainably produced and toxin-free materials.",
    "Easy to clean and maintain over time."
  ] : [],
  detailDescription: index === 0 ? "Our design philosophy focuses on stripping away the unnecessary to highlight pure functionality and clean lines. This product is a testament to that vision—offering a subtle yet powerful statement piece that elevates the atmosphere of your home or office, ensuring both comfort and aesthetic pleasure for years to come." : "",
  detailImages: index === 0 ? ["img/product-description-1.webp", "img/product-description-2.webp"] : []
}));

const site = {
  siteName: "Home Shape",
  announcement: "FREE SHIPPING FOR ALL ORDERS OVER د.إ 150",
  heroEyebrow: "Designed for everyday living",
  heroTitle: "Take a seat.",
  heroEmphasis: "stay a while.",
  heroDescription: "Considered furniture and home pieces that bring a little more comfort to the everyday.",
  heroImage: "img/slider-main-demo-1.jpg.webp",
  heroPrice: "د.إ 199.00",
  heroSlides: [
    { eyebrow: "Designed for everyday living", title: "Take a seat.", emphasis: "stay a while.", description: "Considered furniture and home pieces that bring a little more comfort to the everyday.", price: "AED 199.00", image: "img/slider-main-demo-1.jpg.webp" },
    { eyebrow: "A classic with a softer side", title: "Modern form.", emphasis: "softer edges.", description: "A familiar silhouette, thoughtfully reimagined for slow mornings and long conversations.", price: "AED 149.00", image: "img/slider-main-demo-2-light-opt.jpg.webp" },
    { eyebrow: "Sculpted by nature", title: "Sculpted for", emphasis: "slow living.", description: "Natural curves and beautiful craftsmanship turn a quiet corner into your favourite place.", price: "AED 329.00", image: "img/slider-main-demo-3-light-opt.jpg.webp" }
  ],
  homeCollectionKicker: "Home Shape Collections",
  homeCollectionTitle: "Featured Categories",
  homeCollectionDescription: "Thoughtful furniture collections for dining, lounging, and outdoor living.",
  categoryImages: ["img/furniture.jpg", "img/outdoor.jpeg", "img/restrurent.jpeg", "img/coffee.jpeg", "img/Banquet%20%26%20Event%20Chairs.jpeg"],
  featuredCategories: [
    { name: "Furniture", image: "img/furniture.jpg" }, { name: "Outdoor Furniture", image: "img/outdoor.jpeg" }, { name: "Restaurant Furniture", image: "img/restrurent.jpeg" }, { name: "Coffee Shop Furniture", image: "img/coffee.jpeg" }, { name: "Banquet & Event Chairs", image: "img/Banquet%20%26%20Event%20Chairs.jpeg" }
  ],
  homeProductKicker: "Home Shape Collections",
  homeProductsTitle: "Featured Products",
  homeProductsDescription: "Visit our shop to see amazing creations from our designers.",
  homeAboutKicker: "All-in-one ecommerce solution",
  homeAboutTitle: "Home Shape, Made For Living",
  homeAboutDescription: "Discover thoughtfully selected furniture and considered pieces designed to make every space feel more like home.",
  homeAboutImage: "img/main-egg-chair.jpg.webp",
  homeAboutImageAlt: "Two hanging rattan swing chairs with dark cushions",
  homeAboutReadUrl: "index.html#story",
  homeAboutContactUrl: "pages.html?page=contact",
  homeLandingSlides: [
    { title: "Wooden naïve chair", designer: "Ray Eames, Charles", materials: "Metal, wood, polymer", client: "Home Shape", price: "AED 119.00", image: "img/ref-furniture-03.webp" },
    { title: "Woodspot – Lamp by Seletti", designer: "Ghislain Magrite", materials: "Wood, leather, metal", client: "Home Shape", price: "AED 240.00", image: "img/lamp-new-opt-2.png.webp" },
    { title: "Woodspot – Modern Pattern", designer: "Ray Eames, Charles", materials: "Metal, wood, polymer", client: "Home Shape", price: "AED 299.00", image: "img/slide-3-on-green-sized-opt.png.webp" }
  ],
  homeBrands: [
    { name: "Alessi", image: "img/brand-alessi.png" }, { name: "Eva Solo", image: "img/brand-Eva-Solo.png" }, { name: "Flos", image: "img/brand-flos.png" }, { name: "HAY", image: "img/brand-hay.png" }, { name: "Joseph Joseph", image: "img/brand-Joseph-Joseph.png" }, { name: "Klobe", image: "img/klobe2r.png" }, { name: "Louis Poulsen", image: "img/brand-Louis-Poulsen.png.webp" }, { name: "Magisso", image: "img/brand-Magisso.png" }, { name: "Niche Modern", image: "img/nichemodern.png" }, { name: "PackIt", image: "img/brand-PackIt.png" }, { name: "Rosenthal", image: "img/brand-Rosenthal.png.webp" }, { name: "Vitra", image: "img/brand-witra.png" }
  ],
  homeNewsletterTitle: "JOIN OUR NEWSLETTER NOW",
  homeJournalKicker: "Furniture Guides",
  homeJournalTitle: "Our Latest News",
  homeJournalDescription: "Latest trends and inspiration in interior design.",
  navigation: [
    { label: "About us", url: "pages.html?page=about" },
    { label: "Contact Us", url: "pages.html?page=contact" },
    { label: "Our Story", url: "pages.html?page=story" },
    { label: "Our Blogs", url: "pages.html?page=blog" }
  ],
  categories,
  categoryTree,
  pages: {
    about: {
      title: "Well-coordinated teamwork speaks about us",
      heroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp",
      intro: "We love what we do. Thoughtful design and a well-made home start with people who care.",
      body: "Home Shape brings together furniture with honest materials, enduring forms, and room for real life. We work with makers who care about the details, so the pieces you choose can stay with you for a long time.",
      sectionEyebrow: "SEEMINGLY ELEGANT DESIGN",
      sectionTitle: "About our online store",
      sectionIntro: "We bring considered furniture and useful home pieces together in one welcoming place.",
      image: "img/furniture-title-bg-opt.jpg.webp",
      imageAlt: "A thoughtfully furnished living space",
      features: [
        { title: "We love what we do", description: "A small, thoughtful team brings care to every piece we select." },
        { title: "Our working process", description: "We look closely at the materials, details, and everyday use behind each design." }
      ],
      values: [
        { title: "Thoughtful by nature", description: "We look for honest materials and forms that feel good to live with." },
        { title: "Made with care", description: "We value skilled makers and the small details that make a piece last." },
        { title: "Room for everyone", description: "Good design belongs in the everyday, wherever you call home." }
      ],
      teamEyebrow: "WORDS ABOUT US",
      teamTitle: "Our team",
      teamIntro: "A small team, brought together by a shared love of thoughtful spaces.",
      team: [
        { name: "Studio team", role: "Design & selection", image: "img/ref-furniture-04.webp" },
        { name: "Product team", role: "Materials & makers", image: "img/ref-furniture-06.jpg" },
        { name: "Store team", role: "Customer experience", image: "img/ref-furniture-09.jpg" },
        { name: "Home Shape team", role: "A little bit of everything", image: "img/ref-furniture-11.jpg" }
      ],
      stats: [
        { value: "01", label: "Thoughtful collection" },
        { value: "100%", label: "Selected with care" },
        { value: "Everyday", label: "Made for real life" }
      ],
      historyEyebrow: "A HOME SHAPE STORY",
      historyTitle: "Our company history and facts",
      historyBody: "Home Shape began with a simple idea: bring together useful, beautiful furniture made with care. We continue to seek out thoughtful materials, skilled makers, and timeless shapes that feel at home wherever life happens.",
      historyImage: "img/main-egg-chair.jpg.webp",
      galleryTitle: "Designed for the way you live",
      gallery: ["img/ref-furniture-01.webp", "img/ref-furniture-03.webp", "img/ref-furniture-05.jpg", "img/ref-furniture-08.webp", "img/ref-furniture-10.webp", "img/ref-furniture-12.jpg"]
    },
    story: {
      title: "Our story",
      intro: "Good design makes everyday life feel a little more considered.",
      body: "Home Shape began with a simple idea: bring together useful, beautiful furniture made with care. Today, we continue to seek out thoughtful materials, skilled makers, and timeless shapes that feel at home wherever life happens.",
      heroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp"
    },
    contact: {
      title: "We’d love to hear from you",
      intro: "Questions about a piece, an order, or a project? Our team is here to help.",
      eyebrow: "HERE TO HELP",
      heroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp",
      infoEyebrow: "A REAL PERSON, READY TO HELP",
      infoTitle: "Furniture decisions feel easier with a little guidance.",
      infoDescription: "Tell us what you are planning. Our team can help with products, delivery, and ideas for your space.",
      image: "img/furniture.jpg",
      imageAlt: "A warm, considered furniture showroom",
      visitLabel: "VISIT THE STUDIO",
      callLabel: "CALL OUR TEAM",
      emailLabel: "WRITE TO US",
      hoursLabel: "WHEN WE’RE HERE",
      address: "451 Wall Street, London",
      phone: "+44 (064) 332-1233",
      email: "hello@homeshape.example",
      hours: "Monday – Friday | 9:00 AM – 5:00 PM\nSaturday | 10:00 AM – 2:00 PM",
      locationTitle: "Come by and say hello",
      locationDescription: "A visit gives you time to see the materials and find the right fit for your home.",
      showMap: true,
      mapEmbedUrl: "",
      mapLinkUrl: "",
      mapLinkLabel: "Get directions",
      formEyebrow: "A NOTE TO OUR TEAM",
      formTitle: "What can we help with?",
      formDescription: "Send us a few details and we’ll get back to you as soon as we can.",
      formNameLabel: "Your name",
      formEmailLabel: "Email address",
      formSubjectLabel: "What is this about?",
      formMessageLabel: "Tell us a little more",
      formSubmitLabel: "Send your message",
      successMessage: "Thanks for reaching out. Our team will be in touch soon.",
      responseNote: "We usually reply within one business day.",
      faqEyebrow: "A FEW HELPFUL DETAILS",
      faqTitle: "Good to know before you reach out"
    },
    privacy: {
      title: "Privacy Policy",
      eyebrow: "YOUR PRIVACY MATTERS",
      intro: "Understand how information is handled when you browse or shop with Home Shape.",
      body: "Information you provide, such as contact, order, and delivery details, may be used to respond to questions and fulfill orders.\n\nStore services may process information to support payments, delivery, hosting, and site functionality. Update this policy with the services your store uses and the information they handle.\n\nContact us through the Contact Us page with questions about this policy or requests concerning your information.\n\nPlease update this starter content to accurately describe your practices and the laws that apply to your business before publishing."
    },
    returns: {
      title: "Returns",
      eyebrow: "HELP WITH YOUR ORDER",
      intro: "Get in touch with our team before sending an item back so we can help with next steps.",
      body: "Contact us with your order number and details of the item you want to return before sending anything back. We will reply with the next steps.\n\nAdd your return window, eligible item conditions, exclusions, shipping costs, and refund timing here. These details depend on your store’s policy.\n\nIf an item arrives damaged or incorrect, contact us promptly with your order details and photos so we can assist."
    },
    faqs: {
      title: "Frequently asked questions",
      eyebrow: "A FEW HELPFUL DETAILS",
      intro: "Helpful answers about orders, delivery, payments and caring for your furniture.",
      sectionEyebrow: "HOW CAN WE HELP?",
      sectionTitle: "Good to know",
      closingMessage: "Still have a question? We’re always happy to help.",
      contactLinkLabel: "Contact our team"
    },
    blog: {
      title: "Notes for a more considered home",
      eyebrow: "THE HOME SHAPE JOURNAL",
      intro: "Ideas, inspiration, and a closer look at the pieces that make a room yours."
    }
  },
  faqs: [
    { question: "How long will delivery take?", answer: "In-stock pieces are usually dispatched within 2–5 business days. We’ll keep you updated as your order makes its way to you." },
    { question: "How much does delivery cost?", answer: "Delivery costs are shown at checkout before you place your order. Large furniture may have a separate delivery option." },
    { question: "Can I change or cancel my order?", answer: "Please contact us as soon as possible with your order number. We’ll do our best to help before your order is dispatched." },
    { question: "What if my item arrives damaged?", answer: "Let us know within 48 hours and include a few photos. Our team will help arrange a replacement or another suitable solution." },
    { question: "What payment methods can I use?", answer: "Available payment options are shown securely at checkout. We never store full payment card details." },
    { question: "How do I care for my furniture?", answer: "Care instructions vary by material. Contact us with the product name and we’ll share the right guidance." }
  ],
  posts: [
    { title: "Seating that makes room for conversation", slug: "seating-that-makes-room-for-conversation", image: "img/blog-grid-9.jpg.webp", excerpt: "A few thoughtful details can turn an everyday dining space into a place to linger.", date: "July 23, 2025" },
    { title: "Outdoor pieces, made for slow afternoons", slug: "outdoor-pieces-made-for-slow-afternoons", image: "img/blog-grid-12.jpg.webp", excerpt: "Natural textures and comfortable shapes bring a relaxed feeling to the garden.", date: "June 15, 2025" },
    { title: "A softer approach to modern color", slug: "a-softer-approach-to-modern-color", image: "img/blog-grid-13.jpg.webp", excerpt: "Bring character into a room with warm materials and color in just the right places.", date: "May 30, 2025" }
  ],
  blogHeroBackgroundImage: "img/blog-grid-7.jpg.webp",
  accountHeroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp",
  postSections: [
    { slug: "seating-that-makes-room-for-conversation", heading: "Make space for gathering", body: "The best dining spaces invite people to stay a little longer. Begin with a table that fits the room and leaves enough space to move comfortably around it.~Choose chairs that feel supportive and relaxed. Mixing a familiar shape with a softer finish can make a room feel collected rather than overly matched.", image: "img/blog-grid-9.jpg.webp" },
    { slug: "seating-that-makes-room-for-conversation", heading: "Let materials set the mood", body: "Warm wood, woven textures, and gentle color add depth without making the room feel busy. Small details such as a linen runner or a low vase can bring the setting together while leaving the table ready for everyday use." },
    { slug: "outdoor-pieces-made-for-slow-afternoons", heading: "Create a comfortable outdoor room", body: "A welcoming outdoor space starts with pieces that suit the way you spend time outside. A compact table, comfortable seating, and room to move make a patio feel useful from the first sunny morning to a slow evening outdoors.", image: "img/blog-grid-12.jpg.webp" },
    { slug: "outdoor-pieces-made-for-slow-afternoons", heading: "Bring natural texture outdoors", body: "Layer weather-ready materials with greenery and soft neutral tones. A few well-chosen pieces can make an open terrace feel calm and connected to the rest of the home." },
    { slug: "a-softer-approach-to-modern-color", heading: "Start with a quiet base", body: "Soft color works best when it has room to breathe. Begin with natural finishes and a calm palette, then introduce a considered accent through a chair, lamp, or favorite textile.", image: "img/blog-grid-13.jpg.webp" },
    { slug: "a-softer-approach-to-modern-color", heading: "Repeat color with a light touch", body: "Repeating one tone in a few places helps a room feel balanced. Let materials and daylight do some of the work, and keep the details personal so the space still feels like yours." }
  ],
  blogAuthor: { name: "Home Shape Studio", bio: "Ideas and inspiration for a more considered home.", image: "/legacy/blog-author.svg" },
  footer: {
    description: "Thoughtful things for the everyday. Good for you, a little gentler on the planet.",
    address: "451 Wall Street, London",
    phone: "+44 (064) 332-1233",
    email: "hello@homeshape.example",
    copyright: "© 2025 Home Shape Studio",
    columns: [
      { title: "Recent posts", links: [{ label: "Seating that makes room for conversation", url: "pages.html?page=blog" }, { label: "Outdoor pieces, made for slow afternoons", url: "pages.html?page=blog" }] },
      { title: "Our stores", links: [{ label: "New York", url: "#" }, { label: "London", url: "#" }, { label: "Edinburgh", url: "#" }, { label: "Los Angeles", url: "#" }] },
      { title: "Useful links", links: [{ label: "Privacy Policy", url: "pages.html?page=privacy" }, { label: "Returns", url: "pages.html?page=returns" }, { label: "Contact Us", url: "pages.html?page=contact" }, { label: "FAQs", url: "pages.html?page=faqs" }, { label: "Latest News", url: "pages.html?page=blog" }] }
    ],
    menu: [
      { label: "Shop everything", url: "furniture.html" },
      { label: "About us", url: "pages.html?page=about" },
      { label: "Our Story", url: "pages.html?page=story" },
      { label: "Contact Us", url: "pages.html?page=contact" },
      { label: "FAQs", url: "pages.html?page=faqs" }
    ],
    social: [{ label: "Facebook", url: "#" }, { label: "X", url: "#" }, { label: "Instagram", url: "#" }, { label: "YouTube", url: "#" }]
  },
  popup: {
    enabled: true,
    title: "A little good news for your inbox",
    description: "Get considered furniture stories, new arrivals, and a welcome offer on your first order.",
    button: "Count me in"
  }
};

module.exports = { categories, categoryTree, products, site };
