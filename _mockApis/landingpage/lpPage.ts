import { ref } from 'vue';

import type {
    ProductsSliderTypes,
    UserReviewTypes,
    ListFeatureTypes,
    DemosMegaMenuTypes,
    AppsMegaMenuTypes
} from '@/types/landingpage/LandingpageTypes';

import img1 from '/images/landingpage/demos/demo-main.jpg';
import img2 from '/images/landingpage/demos/demo-dark.jpg';
import img3 from '/images/landingpage/demos/demo-horizontal.jpg';
import img4 from '/images/landingpage/demos/demo-mini.jpg';
import img5 from '/images/landingpage/demos/demo-rtl.jpg';
import img6 from '/images/landingpage/apps/app-calendar.jpg';
import img7 from '/images/landingpage/apps/app-chat.jpg';
import img8 from '/images/landingpage/apps/app-contact.jpg';
import img9 from '/images/landingpage/apps/app-user-profile.jpg';
import img10 from '/images/landingpage/apps/app-note.jpg';
import img11 from '/images/landingpage/apps/app-blog.jpg';
import img12 from '/images/landingpage/apps/app-shop.jpg';
import img13 from '/images/landingpage/apps/app-productlist.jpg';
import img14 from '/images/landingpage/apps/app-invoice.jpg';
import img15 from '/images/landingpage/apps/app-blog-detail.jpg';
import img16 from '/images/landingpage/apps/app-product-detail.jpg';
import img17 from '/images/landingpage/apps/app-kanban.jpg';

const productsSlider: ProductsSliderTypes[] = [
     {
        type:true,
        img: img1,
        name: 'Main',
        link: 'https://spike-nuxtjs-pro-main.netlify.app/dashboards/dashboard1'
    },
    {
        type:true,
        img: img2,
        name: 'Dark',
        link: 'https://spike-nuxtjs-pro-dark.netlify.app/dashboards/dashboard1'
    },
    {
        type:true,
        img: img3,
        name: 'Horizontal',
        link: 'https://spike-nuxtjs-pro-horizontal.netlify.app/dashboards/dashboard1'
    },
    {
        type:true,
        img: img4,
        name: 'Minisidebar',
        link: 'https://spike-nuxtjs-pro-minisidebar.netlify.app/dashboards/dashboard1'
    },
    {
        type:true,
        img: img5,
        name: 'RTL',
        link: 'https://spike-nuxtjs-pro-rtl.netlify.app/dashboards/dashboard1'
    },
    {
        type:false,
        img: img6,
        name: 'Calandar App',
        link: '/apps/calendar'
    },
    {
        type:false,
        img: img7,
        name: 'Chat App',
        link: '/apps/chats'
    },
    {
        type:false,
        img: img8,
        name: 'Contact App',
        link: '/apps/contacts'
    },
    {
        type:false,
        img: img9,
        name: 'User Profile App',
        link: '/apps/userprofile/one'
    },
    {
        type:false,
        img: img10,
        name: 'Notes App',
        link: '/apps/notes'
    },
    {
        type:false,
        img: img11,
        name: 'Blog App',
        link: '/apps/blog/posts'
    },
    {
        type:false,
        img: img15,
        name: 'Blog Detail App',
        link: '/apps/blog/early-black-friday-amazon-deals-cheap-tvs-headphones'
    },
    {
        type:false,
        img: img12,
        name: 'eCommerce Shop App',
        link: '/apps/ecommerce/productsone'
    },
    {
        type:false,
        img: img16,
        name: 'eCommerce Product Detail App',
        link: '/apps/ecommerce/product/one/detail/1'
    },
    {
        type:false,
        img: img13,
        name: 'eCommerce Product List App',
        link: '/apps/ecommerce/productlist'
    },
    {
        type:false,
        img: img14,
        name: 'Invoice App',
        link: '/apps/invoice'
    },
    {
        type:false,
        img: img17,
        name: 'Kanban Application',
        link: '/apps/kanban'
    },

];

/*User Review Section*/
import review1 from '/images/profile/user1.jpg';
import review2 from '/images/profile/user2.jpg';
import review3 from '/images/profile/user3.jpg';

const userReview: UserReviewTypes[] = [
    {
        img: review3,
        title: 'Leslie Alexander',
        subtitle: 'Product Designer, Appzio',
        review: 'Such a beautiful, detailed, and extensive template. Spike admin is the perfect foundation for any project. I highly recommend this huge time saver.'
    },
    {
        img: review1,
        title: 'Jenny Wilson',
        subtitle: 'Features avaibility',
        review: 'The dashboard template from wrappixel has helped me provide a cleanand sleek look to my dashboard and made it look exactly the way I wanted it to, mainly without having.'
    },
    {
        img: review2,
        title: 'Minshan Cui',
        subtitle: 'Features avaibility',
        review: 'The quality of design is excellent, customizability and flexibility much better than the other products available in the market.I strongly recommend the wrappixel to other.'
    },
];

/*Feature Section*/
/*import tabler icons*/
import {
    WandIcon,
    ShieldLockIcon,
    ArchiveIcon,
    AdjustmentsIcon,
    TagIcon,
    DiamondIcon,
    DatabaseIcon,
    LanguageKatakanaIcon,
    BuildingCarouselIcon,
    ArrowsShuffleIcon,
    ChartPieIcon,
    LayersIntersectIcon,
    RefreshIcon,
    BookIcon,
    CalendarIcon,
    MessageIcon,
    PresentationIcon
} from 'vue-tabler-icons';
const listFeature: ListFeatureTypes[] = [
    {
        icon: WandIcon,
        title: '6 Theme Colors',
        subtitle: 'We have included 6 pre-defined Theme Colors with Spike Admin.',
        bgcolor:'primary'
    },
    {
        icon: ShieldLockIcon,
        title: 'Authguard',
        subtitle: 'We have AUTH guard functionality which is based on JWT.',
        bgcolor:'error'
    },
    {
        icon: ArchiveIcon,
        title: '65+ Page Templates',
        subtitle: 'Yes, we have 5 demos & 65+ Pages per demo to make it easier.',
        bgcolor:'info'
    },
    {
        icon: PresentationIcon,
        title: '4+ Frontend Pages',
        subtitle: 'We have added useful frontend pages with Spike Admin',
        bgcolor:'warning'
    },
    {
        icon: AdjustmentsIcon,
        title: '45+ UI Components',
        subtitle: 'Almost 45+ UI Components being given with Spike Admin Pack.',
        bgcolor:'success'
    },
    {
        icon: TagIcon,
        title: 'Vuetify',
        subtitle: 'It is made with Vuetify which is a powerful UI Component Framework.',
        bgcolor:'warning'
    },
    {
        icon: DiamondIcon,
        title: '3400+ Font Icons',
        subtitle: 'Lots of Icon Fonts are included here in the package of Spike Admin.',
        bgcolor:'success'
    },
    {
        icon: DatabaseIcon,
        title: 'Axios',
        subtitle: 'Axios is a promise-based HTTP Client for node.js and the browser.',
        bgcolor:'indigo'
    },
    {
        icon: LanguageKatakanaIcon,
        title: 'i18n Vue',
        subtitle: 'Vue i18n is a powerful internationalization framework for Vue.',
        bgcolor:'primary'
        
    },
    {
        icon: BuildingCarouselIcon,
        title: 'Vue3 Carousel',
        // subtitle: 'The Last Vue3 Carousel You will Ever Need!'
        subtitle: 'Flexible, responsive, and highly customizable Vue carousel component',
        bgcolor:'error'
    },
    {
        icon: ArrowsShuffleIcon,
        title: 'Easy to Customize',
        subtitle: 'Customization will be easy as we understand your pain.',
        bgcolor:'info'
    },
    {
        icon: ChartPieIcon,
        title: 'Lots of Chart Options',
        subtitle: 'You name it and we have it, Yes lots of variations for Charts.',
        bgcolor:'success'
    },
    {
        icon: LayersIntersectIcon,
        title: 'Lots of Table Examples',
        subtitle: 'Data Tables are initial requirement and we added them.',
        bgcolor:'warning'
    },
    {
        icon: RefreshIcon,
        title: 'Regular Updates',
        subtitle: 'We are constantly updating our pack with new features.',
        bgcolor:'warning'
    },
    {
        icon: BookIcon,
        title: 'Detailed Documentation',
        subtitle: 'We have made detailed documentation, so it will easy to use.',
        bgcolor:'indigo'
    },
    {
        icon: CalendarIcon,
        title: 'Calendar Design',
        subtitle: 'Calendar is available with our package & in nice design.',
        bgcolor:'primary'
    },
    {
        icon: MessageIcon,
        title: 'Dedicated Support',
        subtitle: 'We believe in supreme support is key and we offer that.',
        bgcolor:'error'
    }
];

/*Demos Megamenu*/
const demosMegamenu: DemosMegaMenuTypes[] = [
    {
        img: img1,
        name: 'Main',
        link: 'https://spike-nuxtjs-pro-main.netlify.app/dashboards/dashboard1'
    },
    {
        img: img2,
        name: 'Dark',
        link: 'https://spike-nuxtjs-pro-dark.netlify.app/dashboards/dashboard1'
    },
    {
        img: img3,
        name: 'Horizontal',
        link: 'https://spike-nuxtjs-pro-horizontal.netlify.app/dashboards/dashboard1'
    },
    {
        img: img4,
        name: 'Minisidebar',
        link: 'https://spike-nuxtjs-pro-minisidebar.netlify.app/dashboards/dashboard1'
    },
    {
        img: img5,
        name: 'RTL',
        link: 'https://spike-nuxtjs-pro-rtl.netlify.app/dashboards/dashboard1'
    }
];
const appsMegamenu: AppsMegaMenuTypes[] = [
    {
        img: img6,
        name: 'Calandar App',
        link: '/apps/calendar'
    },
    {
        img: img7,
        name: 'Chat App',
        link: '/apps/chats'
    },
    {
        img: img8,
        name: 'Contact App',
        link: '/apps/contacts'
    },
    {
        img: img9,
        name: 'User Profile App',
        link: '/apps/userprofile/one'
    },
    {
        img: img10,
        name: 'Notes App',
        link: '/apps/notes'
    }
];
import frnt1 from '/images/landingpage/frontpages/homepage.jpg';
import frnt2 from '/images/landingpage/frontpages/aboutus.jpg';
import frnt3 from '/images/landingpage/frontpages/contactus.jpg';
import frnt4 from '/images/landingpage/frontpages/portfolio.jpg';
import frnt5 from '/images/landingpage/frontpages/pricing.jpg';
import frnt6 from '/images/landingpage/frontpages/blogpage.jpg';

const FrontPageMenu: DemosMegaMenuTypes[] = [
    {
        img: frnt1,
        name: 'Homepage',
        link: '/front-pages/homepage'
    },
    {
        img: frnt2,
        name: 'About Us',
        link: '/front-pages/about-us'
    },
    {
        img: frnt3,
        name: 'Contact Us',
        link: '/front-pages/contact-us'
    },
    {
        img: frnt4,
        name: 'Portfolio',
        link: '/front-pages/portfolio'
    },
    {
        img: frnt5,
        name: 'Pricing',
        link: '/front-pages/pricing'
    },
    {
        img: frnt6,
        name: 'Blog',
        link: '/front-pages/blog/posts'
    }
];

export { productsSlider, userReview, listFeature, demosMegamenu, appsMegamenu,FrontPageMenu };
