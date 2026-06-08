import Navigation from '../components/landing/Navigation'
import HeroSection from '../components/landing/HeroSection'
import TrustLogosSection from '../components/landing/TrustLogosSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import PricingSection from '../components/landing/PricingSection'
import FAQSection from '../components/landing/FAQSection'
import Footer from '../components/landing/Footer'

function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <Navigation />
            <main>
                <HeroSection />
                <TrustLogosSection />
                <FeaturesSection />
                <HowItWorksSection />
                <PricingSection />
                <FAQSection />
            </main>
            <Footer />
        </div>
    )
}

export default Home
