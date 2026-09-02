
import { motion } from "framer-motion"
import { Layers, PlusCircle } from "lucide-react"


interface WorksSpaceHeaderProps {
    handleOpenCreate?: () => void,
    isButtonVisible?: boolean,
    buttonText?: string,
    subHeading?: string,
    heading?: string
}

const WorksSpaceHeader = ({ handleOpenCreate, isButtonVisible, buttonText = "Add", subHeading = "", heading = "" }: WorksSpaceHeaderProps) => {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5 flex-shrink-0">
            <div>
                <div className="flex items-center gap-1.5 text-navy/60">
                    <Layers className="h-3.5 w-3.5 text-navy" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40">{subHeading}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-navy tracking-tight mt-1">
                    {heading}
                </h1>
            </div>

            {isButtonVisible && <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-colors self-start sm:self-auto"
            >
                <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                {buttonText}
            </motion.button>}
        </div>
    )
}

export default WorksSpaceHeader