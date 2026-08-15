// Generado a partir de catalogo-materiales.json
// Uso: import { UNIDADES, CATEGORIAS, TODOS_LOS_MATERIALES } from './materiales.constants';

export type UnidadCodigo =
  | 'bulto'
  | 'm3'
  | 'm2'
  | 'unidad'
  | 'kg'
  | 'metro'
  | 'galon'
  | 'rollo'
  | 'caja'
  | 'kit';

export interface Unidad {
  codigo: UnidadCodigo;
  nombre: string;
}

export const UNIDADES: Unidad[] = [
  { codigo: 'bulto', nombre: 'Bulto' },
  { codigo: 'm3', nombre: 'Metro cúbico' },
  { codigo: 'm2', nombre: 'Metro cuadrado' },
  { codigo: 'unidad', nombre: 'Unidad' },
  { codigo: 'kg', nombre: 'Kilogramo' },
  { codigo: 'metro', nombre: 'Metro lineal' },
  { codigo: 'galon', nombre: 'Galón' },
  { codigo: 'rollo', nombre: 'Rollo' },
  { codigo: 'caja', nombre: 'Caja' },
  { codigo: 'kit', nombre: 'Kit' },
];

export interface MaterialCatalogo {
  nombre: string;
  unidad: UnidadCodigo;
  notas?: string;
}

export interface CategoriaMaterial {
  codigo: string;
  nombre: string;
  materiales: MaterialCatalogo[];
}

export const CATEGORIAS: CategoriaMaterial[] = [
  {
    codigo: 'cemento_agregados',
    nombre: 'Cemento y agregados',
    materiales: [
      { nombre: 'Cemento', unidad: 'bulto', notas: 'Bulto de 50kg' },
      { nombre: 'Arena de peña/río', unidad: 'm3' },
      { nombre: 'Gravilla/triturado', unidad: 'm3' },
      { nombre: 'Piedra/recebo', unidad: 'm3' },
      { nombre: 'Cal', unidad: 'bulto' },
    ],
  },
  {
    codigo: 'acero_estructura',
    nombre: 'Acero y estructura',
    materiales: [
      { nombre: 'Varilla 3/8"', unidad: 'unidad', notas: 'Barra de 6m' },
      { nombre: 'Varilla 1/2"', unidad: 'unidad', notas: 'Barra de 6m' },
      { nombre: 'Varilla 5/8"', unidad: 'unidad', notas: 'Barra de 6m' },
      { nombre: 'Alambre negro (amarre)', unidad: 'kg' },
      { nombre: 'Malla electrosoldada', unidad: 'unidad', notas: 'Por lámina' },
      { nombre: 'Madera para formaleta', unidad: 'unidad' },
    ],
  },
  {
    codigo: 'mamposteria',
    nombre: 'Mampostería',
    materiales: [
      { nombre: 'Bloque de hormigón 40x20x20', unidad: 'unidad' },
      { nombre: 'Ladrillo tolete', unidad: 'unidad' },
      { nombre: 'Ladrillo prensado', unidad: 'unidad' },
      { nombre: 'Teja de zinc', unidad: 'unidad' },
      { nombre: 'Teja de fibrocemento', unidad: 'unidad' },
      { nombre: 'Teja de barro', unidad: 'unidad' },
    ],
  },
  {
    codigo: 'cubiertas',
    nombre: 'Techos y cubiertas',
    materiales: [
      { nombre: 'Lámina de zinc', unidad: 'unidad' },
      { nombre: 'Plástico/lona calibre (cubierta temporal)', unidad: 'rollo' },
      { nombre: 'Canaleta/bajante', unidad: 'metro' },
      { nombre: 'Clavos para teja', unidad: 'kg' },
    ],
  },
  {
    codigo: 'instalaciones',
    nombre: 'Instalaciones básicas',
    materiales: [
      { nombre: 'Tubería PVC agua/sanitaria', unidad: 'unidad', notas: 'Tubo de 6m, especificar diámetro en observaciones' },
      { nombre: 'Accesorios PVC (codos, uniones)', unidad: 'unidad' },
      { nombre: 'Cable eléctrico', unidad: 'metro' },
      { nombre: 'Interruptores/tomas', unidad: 'unidad' },
    ],
  },
  {
    codigo: 'acabados',
    nombre: 'Acabados',
    materiales: [
      { nombre: 'Pintura', unidad: 'galon' },
      { nombre: 'Cerámica/enchape', unidad: 'm2' },
      { nombre: 'Estuco/masilla', unidad: 'bulto' },
    ],
  },
  {
    codigo: 'herramientas_misceláneos',
    nombre: 'Herramientas y misceláneos',
    materiales: [
      { nombre: 'Pala', unidad: 'unidad' },
      { nombre: 'Pica', unidad: 'unidad' },
      { nombre: 'Carretilla', unidad: 'unidad' },
      { nombre: 'Colchoneta', unidad: 'unidad' },
      { nombre: 'Kit de aseo', unidad: 'kit' },
      { nombre: 'Cobija', unidad: 'unidad' },
    ],
  },
];

// Lista plana de todos los materiales, útil para poblar un <select> o hacer seed de la DB
export const TODOS_LOS_MATERIALES: (MaterialCatalogo & { categoria: string })[] =
  CATEGORIAS.flatMap((cat) =>
    cat.materiales.map((m) => ({ ...m, categoria: cat.codigo }))
  );
