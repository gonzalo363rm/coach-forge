import { FunErrorPage } from "@/components/errors/FunErrorPage"

export default function NotFound() {
    return (
        <FunErrorPage
            code="404"
            icon={
                <span
                    className="inline-block text-7xl animate-[bounce_2.5s_ease-in-out_infinite]"
                    aria-hidden
                >
                    ⚽
                </span>
            }
            title="¿Se te perdió la pelota?"
            description="La página que buscas no está en el campo. Puede que la URL esté mal escrita o que el contenido ya no exista."
            hint="No pasa nada: hasta los cracks fallan un pase de vez en cuando."
        />
    )
}
