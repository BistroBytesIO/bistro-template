import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// This component will scroll the window to the top whenever
// the pathname changes (i.e., when navigation occurs)
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top with a small delay to ensure everything is rendered
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    }, [pathname]);

    return null;
}

export default ScrollToTop;