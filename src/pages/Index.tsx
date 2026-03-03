import { Link } from "react-router-dom";
import { ChefHat, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <ChefHat className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          TYANA <span className="text-primary">Kitchen CFO</span>
        </h1>
        <p className="text-lg text-muted-foreground">Coming Soon</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Index;
