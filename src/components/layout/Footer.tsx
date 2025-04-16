
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-brand-darkGray text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-8 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-400 md:text-left">
            &copy; {new Date().getFullYear()} PlateAI. All rights reserved.
          </p>
        </div>
        <div className="flex justify-center space-x-6 md:order-2">
          <Link to="/" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <Link to="/demo" className="text-gray-400 hover:text-white">
            Demo
          </Link>
          <Link to="/dashboard" className="text-gray-400 hover:text-white">
            Dashboard
          </Link>
          <Link to="/about" className="text-gray-400 hover:text-white">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
