import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';

export const metadata = {
  title: "项目矩阵 | XingHuiSama の 博客",
  description: "开源项目与代码仓库展示",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <ProjectsBoard />
        </div>
      </PageTransition>
    </div>
  );
}