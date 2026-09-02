const Section = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="py-6 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-navy/[0.06] flex items-center justify-center text-navy/50">
                {icon}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
        </div>
        {children}
    </div>
);

export default Section;
