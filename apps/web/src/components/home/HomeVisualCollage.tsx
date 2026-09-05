const frame =
    "h-auto w-full rounded-xl border border-zinc-200/90 object-contain shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/10 dark:border-zinc-700 dark:ring-white/5"

export function HomeVisualCollage() {
    return (
        <div className="w-full overflow-hidden">
            <div className="relative mx-auto aspect-[11/10] w-full max-w-4xl sm:aspect-[16/11]">
                {/* El contenido visual ocupa ~0–74%; se desplaza para centrarlo */}
                <div className="absolute inset-0 translate-x-[13%]">
                    {/* Preview — atrás / arriba izquierda */}
                    <div className="absolute left-0 top-[2%] z-10 w-[58%] -rotate-1 sm:w-[54%]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/home/class-in-progress-real.png"
                            alt="Clase en curso con ejercicios y cronómetro"
                            width={1920}
                            height={911}
                            className={frame}
                            decoding="async"
                            fetchPriority="high"
                        />
                    </div>

                    {/* Editor — más abajo, por encima del preview y de la vertical izq */}
                    <div className="absolute left-[12%] top-[52%] z-30 w-[54%] rotate-1 sm:left-[14%] sm:top-[50%] sm:w-[50%]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/home/canvas-editor-v2.png"
                            alt="Editor visual de ejercicios"
                            width={1920}
                            height={911}
                            className={frame}
                            decoding="async"
                            fetchPriority="high"
                        />
                    </div>

                    {/* Orden vertical — esquina izq, un poco más arriba */}
                    <div className="absolute bottom-[6%] left-[1%] z-20 w-[30%] max-w-[10.5rem] rotate-[3deg] sm:bottom-[8%] sm:left-[2%] sm:w-[24%] sm:max-w-[12rem]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/home/exercise-order-tt.png"
                            alt="Orden del ejercicio con diagramas de mesa"
                            width={345}
                            height={747}
                            className={frame}
                            decoding="async"
                            fetchPriority="high"
                        />
                    </div>

                    {/* Clase mobile — más cerca del centro, por encima de todo */}
                    <div className="absolute bottom-[30%] right-[26%] z-40 w-[30%] max-w-[10.5rem] -rotate-[3deg] sm:bottom-[32%] sm:right-[28%] sm:w-[24%] sm:max-w-[12rem]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/home/class-mobile-v2.png"
                            alt="Clase en curso en el celular"
                            width={392}
                            height={750}
                            className={frame}
                            decoding="async"
                            fetchPriority="high"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
