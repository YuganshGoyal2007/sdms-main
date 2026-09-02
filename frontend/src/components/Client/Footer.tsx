import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
    return (
        <div className='fixed w-full sm:w-[calc(100vw-18rem)] sm:h-12 h-10 flex items-center justify-center bg-white border-t border-gray-200 shadow-sm bottom-0 sm:left-72'>

            {/* For Bigger Screen */}
            <p className="sm:text-base text-xs sm:block hidden">© {new Date().getFullYear()} - Gautam Buddha University <span className="mx-2">|</span> Developed by <Link to={'/developers'} className='transition-all duration-300 hover:underline font-semibold hover:text-[#6a334e]'>Nishant Chauhan & Aman Rai</Link></p>

            {/* For mobiles */}
            <div className="sm:hidden text-sm flex flex-col justify-center items-center">
                <p>© {new Date().getFullYear()} - Gautam Buddha University </p>
                {/* <p> Developed by <Link to={'/developers'} className='hover:underline font-semibold hover:text-[#6a334e]'>Nishant Chauhan</Link></p> */}
            </div>
        </div>
    )
}

export default Footer