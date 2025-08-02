import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Create from "./Create";

import Study from "./Study";

import Stats from "./Stats";

import MyFlashcards from "./MyFlashcards";

import StudyMyCards from "./StudyMyCards";

import ReviewToday from "./ReviewToday";

import Settings from "./Settings";

import Account from "./Account";

import Pricing from "./Pricing";

import TimedChallenge from "./TimedChallenge";

import Achievements from "./Achievements";

import Support from "./Support";

import EstudoPersonalizado from "./EstudoPersonalizado";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Create: Create,
    
    Study: Study,
    
    Stats: Stats,
    
    MyFlashcards: MyFlashcards,
    
    StudyMyCards: StudyMyCards,
    
    ReviewToday: ReviewToday,
    
    Settings: Settings,
    
    Account: Account,
    
    Pricing: Pricing,
    
    TimedChallenge: TimedChallenge,
    
    Achievements: Achievements,
    
    Support: Support,
    
    EstudoPersonalizado: EstudoPersonalizado,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Create" element={<Create />} />
                
                <Route path="/Study" element={<Study />} />
                
                <Route path="/Stats" element={<Stats />} />
                
                <Route path="/MyFlashcards" element={<MyFlashcards />} />
                
                <Route path="/StudyMyCards" element={<StudyMyCards />} />
                
                <Route path="/ReviewToday" element={<ReviewToday />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/TimedChallenge" element={<TimedChallenge />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/EstudoPersonalizado" element={<EstudoPersonalizado />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}