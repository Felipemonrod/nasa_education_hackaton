/**
 * Nome do jogo ("HEAD X") com a mesma identidade visual em todas as telas
 * (menu e telas de carregamento). Um lugar so: ao renomear, troca aqui.
 * Fica em ingles nos dois idiomas, por ser nome proprio.
 */
export function BrandName({ className = '' }: { className?: string }): JSX.Element {
  return (
    <span className={`font-display font-extrabold leading-none tracking-tight ${className || 'text-white'}`}>
      HEAD<span className="text-power"> X</span>
    </span>
  );
}
