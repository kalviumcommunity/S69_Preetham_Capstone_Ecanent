import { useState, useEffect } from "react";

const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem("darkModePreference");

    if (savedPreference !== null) {
      setIsDarkMode(savedPreference === "true");
    } else {
      checkTime();
    }

    function checkTime() {
      const hours = new Date().getHours();
      const shouldBeDark = hours >= 18 || hours < 6;
      setIsDarkMode(shouldBeDark);
    }

    const intervalId = setInterval(checkTime, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkModePreference", newMode.toString());
  };

  return { isDarkMode, toggleDarkMode };
};

export default useDarkMode;