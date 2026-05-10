import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { tools } from "@/lib/tools";

export const ToolsGrid = () => (
  <section id="tools" className="py-20 sm:py-28 bg-subtle-gradient">
    <div className="container-tight">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary mb-3">All-in-one toolkit</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Every PDF tool you need, in one place
        </h2>
        <p className="mt-4 text-muted-foreground">
          {tools.length}+ powerful tools that run instantly in your browser. No installation. No watermarks.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.025, 0.4) }}
            >
              <Link
                to={`/${tool.slug}`}
                className="group relative flex flex-col items-center justify-start text-center h-full p-3 sm:p-4 rounded-2xl border border-border bg-card hover:shadow-soft hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              >
                <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity`} />
                <div className={`relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-soft mb-2.5`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">{tool.name}</h3>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);
