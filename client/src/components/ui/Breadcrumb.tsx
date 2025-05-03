import React from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface SimpleBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link href="/">
        <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Home size={14} />
        </div>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-muted-foreground" />
          {item.href ? (
            <Link href={item.href}>
              <div className={`text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${index === items.length - 1 ? 'font-medium text-foreground' : ''}`}>
                {item.label}
              </div>
            </Link>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default SimpleBreadcrumb;