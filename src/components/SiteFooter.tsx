import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-gradient-emerald">GOMATHI TEX</p>
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
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />142, Big Bazaar Street, Coimbatore, TN 641001</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" />+91 98430 11223</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" />care@gomathitex.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        {"\u00A9"} {new Date().getFullYear()} Gomathi Tex. All rights reserved.
      </div>
    </footer>
  );
}
