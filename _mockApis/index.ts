import mock from './mockAdapter';

// import './apps/chat'; // Disabled - using real chat API
import './apps/ecommerce';
import './apps/userprofile/posts';
import './apps/userprofile/followers';
import './apps/userprofile/friends';
import './apps/userprofile/gallery';
import './apps/userprofile/photos';
import './apps/blog/index';
import './headerData';
import './apps/notes';
import './apps/contact';
import './headerData';
import './components/school-pages/ClassesData';
import './apps/kanban';
import './apps/tickets';
import './apps/email';
import './apps/invoice';

mock.onAny().passThrough();
