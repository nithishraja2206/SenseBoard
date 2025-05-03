import React from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link href="/">
        <a className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <Home size={14} />
        </a>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-muted-foreground" />
          {item.href ? (
            <Link href={item.href}>
              <a className={`text-muted-foreground hover:text-foreground transition-colors ${index === items.length - 1 ? 'font-medium text-foreground' : ''}`}>
                {item.label}
              </a>
            </Link>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;