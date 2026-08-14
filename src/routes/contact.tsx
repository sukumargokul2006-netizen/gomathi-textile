import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Gomathi Tex — Store, Phone & Email" },
      { name: "description", content: "Reach the Gomathi Tex team for order help, bulk enquiries or store visits in Tamil Nadu." },
      { property: "og:title", content: "Contact Gomathi Tex" },
      { property: "og:description", content: "Phone, email and store address for Gomathi Tex." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-semibold">Get in touch</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Thanks! We'll reply within one business day.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div>
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="c-msg">Message</Label>
            <Textarea id="c-msg" rows={5} required className="mt-1.5" />
          </div>
          <Button type="submit">Send message</Button>
        </form>

        <ul className="space-y-6 text-sm">
          <li className="flex gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <span>New 6th Ward, Kattu Melvannara Street, Tharamangalam, Salem 636502, Tamil Nadu, India</span>
          </li>
          <li className="flex gap-3">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            <a href="tel:+919789119508" className="hover:text-primary">+91 97891 19508</a>
          </li>
          <li className="flex gap-3">
            <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
            <a href="https://wa.me/918148119508" target="_blank" rel="noreferrer" className="hover:text-primary">
              WhatsApp +91 81481 19508
            </a>
          </li>
          <li className="flex gap-3">
            <Mail className="h-5 w-5 shrink-0 text-primary" />
            <a href="mailto:gomathitex@gmail.com" className="hover:text-primary">gomathitex@gmail.com</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
