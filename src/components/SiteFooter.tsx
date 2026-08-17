import { Link } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logoAsset from "@/assets/gomathi-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="Gomathi Tex peacock logo"
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 rounded-full object-contain"
            />
            <p className="font-display text-lg font-semibold text-gradient-emerald">GOMATHI TEX</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Handpicked sarees, salwar sets and traditional wear woven with care in Tamil Nadu and
            delivered across India.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">All products</Link></li>
            <li><Link to="/categories" className="hover:text-primary">Categories</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Your bag</Link></li>
            <li><Link to="/account" className="hover:text-primary">Your orders</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/auth" className="hover:text-primary">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Visit the store</h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />New 6th Ward, Kattu Melvannara Street, Tharamangalam, Salem 636502, Tamil Nadu, India</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" />+91 97891 19508</li>
            <li className="flex gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-primary" />WhatsApp: +91 81481 19508</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" />gomathitex@gmail.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        {"\u00A9"} {new Date().getFullYear()} Gomathi Tex. All rights reserved.
      </div>
    </footer>
  );
}
