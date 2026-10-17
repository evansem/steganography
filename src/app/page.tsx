import { Blacklight } from "@/components/Blacklight";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Security } from "@/components/Security";
import { Footer, Nav } from "@/components/SiteChrome";
import { Workbench } from "@/components/Workbench";

export default function Home() {
  return (
    <>
      <Blacklight />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav />
        <main>
          <Hero />
          <Workbench />
          <HowItWorks />
          <Security />
        </main>
        <Footer />
      </div>
    </>
  );
}
