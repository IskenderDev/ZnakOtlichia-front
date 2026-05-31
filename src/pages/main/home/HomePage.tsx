import { useEffect } from "react"
import Seo from "@/shared/components/Seo"
import ContactForm from "@/shared/components/ContactForm"
import FaqSection from "@/widgets/home/FaqSection"
import HeroSection from "@/widgets/home/HeroSection"
import NumbersMarketSection from "@/widgets/home/NumbersMarketSection"
import ProjectsSection from "@/widgets/home/ProjectsSection"

interface HomePageProps {
  hideSeo?: boolean;
}

export default function HomePage({ hideSeo = false }: HomePageProps = {}) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    })
  }, [])

  return (
    <>
      {hideSeo ? null : (
        <Seo title="Красивые автономера в Москве и Московской области — Знак Отличия | Красивые гос номера, оценка автономера, выкуп автономеров" description="Купить красивые автономера в Москве и Московской области. Оценить автономер. Выкупить автономер. Купить гос номер. Оценить гос номер" />
      )}
      <div> <div
  aria-hidden
  className="
    pointer-events-none
    absolute
    left-1/2
    -top-100
    -z-10
    -translate-x-1/2

    translate-y-[clamp(5%,10vw,20%)]

    h-[clamp(300px,60vw,1100px)]
    w-[clamp(400px,90vw,2000px)]

    rounded-full

    bg-[radial-gradient(circle,_rgba(0,45,104,0.95)_0%,_rgba(0,45,104,0.65)_25%,_rgba(0,45,104,0.35)_45%,_rgba(3,7,18,0.2)_60%,_transparent_75%)]

    blur-[clamp(60px,10vw,200px)]
  "
/>
        <HeroSection />
        <NumbersMarketSection />
        <ProjectsSection />
        <FaqSection />
        <ContactForm />
      </div>
    </>
  );
}
