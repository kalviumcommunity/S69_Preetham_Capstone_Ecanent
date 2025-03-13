import { useState, useEffect } from "react";

const DarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    function checkTime() {
      const hours = new Date().getHours();
      setIsDarkMode(hours >= 18 || hours < 6);
    }

    checkTime();
    const intervalId = setInterval(checkTime, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return isDarkMode;
};

export default DarkMode;