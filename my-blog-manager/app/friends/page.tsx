import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import FriendsBoard from './FriendsBoard';

export const metadata = {
  title: "友链 | XingHuiSama の 博客",
  description: "赛博空间里的有趣灵魂",
};

export default function FriendsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <FriendsBoard />
        </div>
      </PageTransition>
    </div>
  );
}