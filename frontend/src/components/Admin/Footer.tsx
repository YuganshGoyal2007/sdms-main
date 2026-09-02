import { Link } from "react-router-dom"

const Footer = () => {

    return (
        <div className={`sm:w-[80vw] w-[85vw] min-h-[5vh] sm:min-h-[7vh] flex items-center justify-center fixed bottom-0 transition-all batch-300 bg-[#f8f9fa] border-t border-[#d9d9d9]`}>
            {/* For Bigger Screen */}
            <p className="sm:text-base text-xs sm:block hidden">© {new Date().getFullYear()} Gautam Buddha University <span className="mx-2">|</span> Developed by <Link to={'/developers'} className='transition-all duration-300 hover:underline font-semibold hover:text-[#6a334e]'>Nishant Chauhan, Ashish Kumar & Yugansh Goyal</Link></p>

            {/* For mobiles */}
            <div className="sm:hidden text-xs flex flex-col justify-center items-center">
                <p>© {new Date().getFullYear()} - Gautam Buddha University </p>
                <p> Developed by <Link to={'/developers'} className='hover:underline font-semibold hover:text-[#6a334e]'>Nishant Chauhan, Ashish Kumar & Yugansh Goyal</Link></p>
            </div>
        </div>
    )
}

export default Footer