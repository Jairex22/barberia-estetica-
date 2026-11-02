import { Legal } from '../Legal';
export const metadata = { title: 'Normas de comunidad' };
export default function Page() {
  return (<Legal title="Normas de comunidad" updated="noviembre de 2026">
    <p>Sobremesa funciona si todas las personas se sienten respetadas y seguras. Estas normas se aplican a perfiles, fotos y mensajes.</p>
    <h2>Sí</h2><ul><li>Fotos recientes en las que se te vea con claridad; sin filtros que cambien tu apariencia.</li><li>Honestidad sobre lo que buscas.</li><li>Respeto cuando alguien no responde o no quiere seguir.</li></ul>
    <h2>No</h2><ul><li>Menores de edad, ni contenido que los involucre.</li><li>Desnudez o contenido sexual explícito.</li><li>Acoso, insultos, amenazas, discriminación o discurso de odio.</li><li>Estafas, solicitudes de dinero, inversiones, promoción comercial o enlaces para sacar a la gente de la app de forma insistente.</li><li>Suplantación, perfiles falsos, datos de otras personas.</li><li>Compartir información privada ajena (dirección, teléfono, fotos íntimas).</li></ul>
    <h2>Qué hacemos</h2><p>Revisamos fotos antes de publicarlas, atendemos reportes y podemos advertir, suspender o eliminar cuentas. Quien reporta permanece en el anonimato. Puedes apelar una decisión desde Ayuda → Apelación; una persona del equipo la revisará.</p>
  </Legal>);
}
