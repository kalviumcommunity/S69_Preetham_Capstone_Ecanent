import React, {useRef, useState, useEffect} from 'react';
import { motion, useScroll, useTransform, } from 'framer-motion';
import Logo from "../assets/Logo.png"
import { Link } from 'react-router-dom';
import { Bell, ShieldCheck, Users, RefreshCw } from 'lucide-react';
import m1 from "../assets/m1.mp4"
import m3 from "../assets/m3.mp4"
import { Menu } from "lucide-react"; 

function LandingPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const videoRef = useRef(null);
  const mobileRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: videoRef,
    offset: ["start end", "end start"], 
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.5, 1]);
  const isMobile = window.innerWidth < 768;
  const videoScale = useTransform(scrollYProgress, [0, 0.5, 1],[1, 1.5, 1]);

  const featureData = [
    { title: 'Instant Notifications', icon: <Bell className="text-cyan-500" />, description: 'Receive real-time alerts on deadlines, events, and announcements.' },
    { title: 'Secure Chats', icon: <ShieldCheck className="text-cyan-500" />, description: 'End-to-end encrypted chats for private student-faculty communication.' },
    { title: 'Group Collaboration', icon: <Users className="text-cyan-500" />, description: 'Effortlessly manage class groups for projects and discussions.' },
    { title: 'Real-Time Updates', icon: <RefreshCw className="text-cyan-500" />, description: 'Stay updated with live changes in schedules and assignments.' },
  ];

  useEffect(() => {
    if (isMobile && mobileRef.current) {
      videoRef.current.playbackRate = 1.5; 
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-white text-white overflow-x-hidden relative">
      <motion.nav 
  className="fixed top-0 w-screen bg-gradient-to-br from-teal-400 to-cyan-900 backdrop-blur-sm z-50 py-2 md:py-4 shadow-md"
  initial={{ y: -100 }}
  animate={{ y: 0 }}
  transition={{ duration: 0.5 }}
>
  <div className="md:max-w-6xl md:mx-auto md:px-1 md:flex md:flex-row grid grid-cols-2 md:justify-between  items-center">
    {/* Logo */}
    <motion.h2 
      className="md:text-2xl text-lg font-bold bg-cyan-500 bg-clip-text text-transparent"
      whileHover={{ scale: 1.05 }}
    >
      <div className='flex flex-row gap-3 bg-white p-1 rounded-full mr-2 ml-2 md:items-start items-center justify-self-start'>
        <img src={Logo} className='w-10 h-10'/>
        <h2 className='bg-cyan-600 bg-clip-text text-transparent md:mr-2'>Ecanent</h2>
      </div>
    </motion.h2>

    {/* Desktop Menu */}
    <div className="space-x-6 ml-2 hidden md:flex">
      <motion.a href="#features" className="text-white hover:text-cyan-200 p-2 transition-colors" whileHover={{ x: 5 }}>Features</motion.a>
      <Link to="/signup"><h1 className="text-white hover:bg-white p-2 pt-2 rounded-full hover:text-cyan-500 transition-colors">Signup</h1></Link>
      <Link to="/login"><h1 className="text-white hover:bg-white hover:text-cyan-500 p-2 rounded-full transition-colors">Login</h1></Link>
    </div>

    {/* Mobile Menu Toggle */}
    <div className="md:hidden">
      <Menu className="justify-self-end mr-3 text-white w-7 h-7 cursor-pointer" onClick={() => setShowMobileMenu(prev => !prev)} />
    </div>
  </div>

  {/* Mobile Dropdown */}
  {showMobileMenu && (
    <div className="md:hidden flex flex-col items-center bg-cyan-800 text-white w-full py-4 space-y-4">
      <a href="#features" className="hover:text-cyan-200">Features</a>
      <Link to="/signup"><span className="hover:text-cyan-200">Signup</span></Link>
      <Link to="/login"><span className="hover:text-cyan-200">Login</span></Link>
    </div>
  )}
      </motion.nav>

      <section className="min-h-screen flex items-center justify-center py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl text-center"
        >
          <h1 className="md:text-7xl text-5xl font-extrabold mb-6 tracking-tight">
          <span className="bg-gradient-to-br from-teal-400  to-cyan-900 bg-clip-text text-transparent md:justify-self-start justify-self-center">
            Ecanent
            </span>
          </h1>
          <p className="md:text-3xl text-xl font-medium text-cyan-500 mb-10">
            Revolutionize School and College Communication
          </p>
          <p className="text-lg text-white max-w-2xl mx-auto bg-gradient-to-br from-teal-400  to-cyan-900   backdrop-blur-sm p-8 rounded-xl shadow-lg">
            Ecanent is your all-in-one chat platform designed to connect students, faculty, and staff seamlessly. From instant notifications to secure group chats, we simplify communication for academic success. Say goodbye to cluttered emails and fragmented apps—Ecanent keeps everything in one place.
          </p>
          <motion.div 
            className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
          <Link to="/signup"> 
          <motion.div
            className="transform text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg bg-gradient-to-br from-teal-400 to-cyan-900 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            Get Started →
          </motion.div>
          </Link>

            
          </motion.div>
        </motion.div>
      </section>



<section id="features" className="relative py-24 px-4 bg-white overflow-hidden">
  <h2 className="text-4xl font-bold text-center mb-20 bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">
    Why Choose Ecanent?
  </h2>



  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-15 h-full w-1 bg-gradient-to-b from-cyan-500 to-teal-500 z-10" />

  <div className="relative z-20 max-w-3xl mx-auto space-y-20">
    {featureData.map(({ title, description, icon }, index) => (
      <motion.div
        key={index}
        whileHover={{ scale: 1.02 }}
        className={`bg-white border border-gray-100 p-6 rounded-xl shadow-md w-full relative flex flex-col items-center`}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 w-5 h-5 bg-cyan-500 rounded-full border-4 border-white shadow-md z-20" />
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-gray-700 mt-2">{description}</p>
        </div>
      </motion.div>
    ))}
  </div>
</section>


<section
  ref={videoRef}
  className="relative py-24 bg-gradient-to-b from-white to-cyan-50 px-0 overflow-hidden"
>
  
<h2 className="text-3xl font-bold mb-8 text-transparent bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-center">
            Live Preview
          </h2>
  <div className="w-screen h-screen flex items-center justify-center" ref={mobileRef}>
    <motion.video
      style={{
        scale: videoScale, 
        maxWidth: '60%',  
        maxHeight: '60%', 
      }}
      autoPlay
      muted
      loop
      playsInline
      className="object-contain rounded-xl shadow-xl w-auto h-auto"
    >
      <source src={`${isMobile? m3 : m1}`} type="video/mp4" />
    </motion.video>
  </div>
</section>



      <section className="py-24 px-6 bg-white">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-12 bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-md"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-black italic">"Ecanent transformed how our school communicates—it's intuitive and efficient!"</p>
              <p className="mt-4 text-cyan-500 font-semibold">- Bharath, School Administrator</p>
            </motion.div>
            <motion.div 
              className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-md"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-black italic">"Perfect for student and faculty updates. Highly recommended!"</p>
              <p className="mt-4 text-cyan-500 font-semibold">- Chethan, Professor</p>
            </motion.div>
          </div>
          <div className="mt-12 text-2xl font-medium text-white/80">
            <p>Users trust Ecanent for seamless communication.</p>
            <p>Highly rated from schools and colleges.</p>
          </div>
        </motion.div>
      </section>

      

      <footer className="flex justify-center items-center  bg-cyan-900/80 backdrop-blur-sm text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-white/70 text-sm mb-2 mt-2">© 2025 Ecanent. All rights reserved.</p>
        
        </motion.div>
      </footer>
    </div>
  );
}

export default LandingPage;  
