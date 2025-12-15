import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { Minus, Plus, Box } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, LoadingScreen } from '../components/ui'
import { useProdutos } from '../hooks/useProdutos'
import { useToast } from '../components/ui/Toast'
import type { Produto } from '../types/database'

// Cores do design system
const COLORS = {
    primary: '#7C3AED', // Roxo - 4kg
    accent: '#F97316',  // Laranja - 1kg
}

// Interface para Zona de Armazenamento
interface ShelfZone {
    position: [number, number, number]
    dimensions: [number, number, number] // width, height, depth
}

// Fun\u00e7\u00e3o de Bin Packing: Calcula posi\u00e7\u00f5es automaticamente
function calculateBucketPositions(
    zone: ShelfZone,
    bucketRadius: number,
    bucketHeight: number,
    quantity: number,
    padding: number
): [number, number, number][] {
    const positions: [number, number, number][] = []
    const [zoneX, zoneY, zoneZ] = zone.position
    const [width, height, depth] = zone.dimensions

    const bucketDiameter = bucketRadius * 2
    const spacingX = bucketDiameter + padding
    const spacingZ = bucketDiameter + padding
    const spacingY = bucketHeight + padding * 0.5

    // Calcular quantos cabem em cada dimensão
    const bucketsPerRow = Math.max(1, Math.floor(width / spacingX))
    const bucketsPerDepth = Math.max(1, Math.floor(depth / spacingZ))
    const bucketsPerHeight = Math.max(1, Math.floor(height / spacingY))

    const maxCapacity = bucketsPerRow * bucketsPerDepth * bucketsPerHeight
    const actualQuantity = Math.min(quantity, maxCapacity)

    // Offset para centralizar na zona
    const startX = zoneX - (width / 2) + (bucketDiameter / 2) + (padding / 2)
    const startZ = zoneZ - (depth / 2) + (bucketDiameter / 2) + (padding / 2)
    const startY = zoneY - (height / 2) + (bucketHeight / 2)

    for (let i = 0; i < actualQuantity; i++) {
        const col = i % bucketsPerRow
        const layer = Math.floor(i / bucketsPerRow) % bucketsPerDepth
        const row = Math.floor(i / (bucketsPerRow * bucketsPerDepth))

        positions.push([
            startX + col * spacingX + (Math.random() * 0.01 - 0.005),
            startY + row * spacingY,
            startZ + layer * spacingZ + (Math.random() * 0.01 - 0.005)
        ])
    }

    return positions
}

// Componente para visualizar zona (wireframe box)
function ZoneVisualizer({ zone, color }: { zone: ShelfZone; color: string }) {
    return (
        <mesh position={zone.position}>
            <boxGeometry args={zone.dimensions} />
            <meshBasicMaterial color={color} wireframe />
        </mesh>
    )
}

// Componente 3D: Modelo da Geladeira
interface GeladeiraModelProps {
    rotation: [number, number, number]
    scale: number
}

function GeladeiraModel({ rotation, scale }: GeladeiraModelProps) {
    const { scene } = useGLTF('/geladeira.glb')

    // Aplicar material plástico brilhante em todos os meshes
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.material = new THREE.MeshStandardMaterial({
                    color: 'white',
                    roughness: 0.1,
                    metalness: 0.05
                })
                mesh.castShadow = true
                mesh.receiveShadow = true
            }
        })
    }, [scene])

    return (
        <primitive
            object={scene}
            scale={scale}
            position={[0, -1.6, 0]}
            rotation={rotation}
        />
    )
}

// Preload do modelo
useGLTF.preload('/geladeira.glb')

// Componente 3D: Cena da Geladeira
interface GeladeiraSceneProps {
    produtos: Produto[]
}

function GeladeiraScene({ produtos }: GeladeiraSceneProps) {
    // CONTROLES LEVA - SMART SHELVES SYSTEM
    const controls = useControls({
        // Geladeira
        Geladeira: folder({
            fridgeRotY: { value: -90, min: -360, max: 360, step: 15, label: 'Rotação Y' },
            fridgeScale: { value: 0.5, min: 0.1, max: 5, step: 0.1, label: 'Escala' }
        }),
        // Baldes
        'Baldes 1kg': folder({
            bucketScale_1kg: { value: 5.1, min: 0.1, max: 10, step: 0.1, label: 'Escala' },
            bucket1kgRadius: { value: 0.12, min: 0.01, max: 1, step: 0.01, label: 'Raio' },
            bucket1kgHeight: { value: 0.25, min: 0.05, max: 2, step: 0.01, label: 'Altura' },
            rotX_1kg: { value: 180, min: 0, max: 360, step: 15, label: 'Rotação X' }
        }),
        'Baldes 4kg': folder({
            bucketScale_4kg: { value: 2.8, min: 0.1, max: 10, step: 0.1, label: 'Escala' },
            bucket4kgRadius: { value: 0.35, min: 0.01, max: 1, step: 0.01, label: 'Raio' },
            bucket4kgHeight: { value: 0.65, min: 0.05, max: 2, step: 0.01, label: 'Altura' },
            rotX_4kg: { value: 180, min: 0, max: 360, step: 15, label: 'Rotação X' }
        }),
        //ZONES (Prateleiras)
        'Zona 1 (1kg - Topo)': folder({
            z1_x: { value: 0, min: -10, max: 10, step: 0.05 },
            z1_y: { value: 0.85, min: -10, max: 10, step: 0.05 },
            z1_z: { value: -7.1, min: -15, max: 10, step: 0.05 },
            z1_width: { value: 10, min: 0.1, max: 10, step: 0.1 },
            z1_height: { value: 3.4, min: 0.1, max: 5, step: 0.1 },
            z1_depth: { value: 6.4, min: 0.1, max: 10, step: 0.1 }
        }),
        'Zona 2 (1kg - Meio)': folder({
            z2_x: { value: 0, min: -2, max: 2, step: 0.05 },
            z2_y: { value: -3.65, min: -15, max: 10, step: 0.05 },
            z2_z: { value: -6.75, min: -15, max: 10, step: 0.05 },
            z2_width: { value: 10, min: 0.1, max: 10, step: 0.1 },
            z2_height: { value: 3.3, min: 0.1, max: 5, step: 0.1 },
            z2_depth: { value: 6.4, min: 0.1, max: 10, step: 0.1 }
        }),
        'Zona 3 (4kg - Meio-Baixo)': folder({
            z3_x: { value: 0, min: -10, max: 10, step: 0.05 },
            z3_y: { value: -7.1, min: -15, max: 10, step: 0.05 },
            z3_z: { value: -5.7, min: -15, max: 10, step: 0.05 },
            z3_width: { value: 10, min: 0.1, max: 10, step: 0.1 },
            z3_height: { value: 3.3, min: 0.1, max: 5, step: 0.1 },
            z3_depth: { value: 6.1, min: 0.1, max: 10, step: 0.1 }
        }),
        'Zona 4 (4kg - Base)': folder({
            z4_x: { value: 0, min: -10, max: 10, step: 0.05 },
            z4_y: { value: -11.4, min: -15, max: 10, step: 0.05 },
            z4_z: { value: -5, min: -15, max: 10, step: 0.05 },
            z4_width: { value: 10, min: 0.1, max: 10, step: 0.1 },
            z4_height: { value: 4, min: 0.1, max: 5, step: 0.1 },
            z4_depth: { value: 5, min: 0.1, max: 10, step: 0.1 }
        }),
        // Geral
        'Espaçamento': folder({
            padding_1kg: { value: 1.08, min: 0, max: 2, step: 0.01, label: 'Baldes 1kg' },
            padding_4kg: { value: 1.28, min: 0, max: 2, step: 0.01, label: 'Baldes 4kg' }
        }),
        showZones: { value: true, label: 'Mostrar Zonas' }
    })

    // Separar produtos por tipo
    const produtos1kg = produtos.filter(p =>
        p.nome.toLowerCase().includes('1kg') || p.codigo.includes('1KG')
    )
    const produtos4kg = produtos.filter(p =>
        p.nome.toLowerCase().includes('4kg') || p.codigo.includes('4KG')
    )

    // Definir zonas baseadas nos controles
    const zone1: ShelfZone = {
        position: [controls.z1_x, controls.z1_y, controls.z1_z],
        dimensions: [controls.z1_width, controls.z1_height, controls.z1_depth]
    }
    const zone2: ShelfZone = {
        position: [controls.z2_x, controls.z2_y, controls.z2_z],
        dimensions: [controls.z2_width, controls.z2_height, controls.z2_depth]
    }
    const zone3: ShelfZone = {
        position: [controls.z3_x, controls.z3_y, controls.z3_z],
        dimensions: [controls.z3_width, controls.z3_height, controls.z3_depth]
    }
    const zone4: ShelfZone = {
        position: [controls.z4_x, controls.z4_y, controls.z4_z],
        dimensions: [controls.z4_width, controls.z4_height, controls.z4_depth]
    }

    // Calcular quantidades
    const total1kg = produtos1kg.reduce((acc, p) => acc + (p.estoque_atual || 0), 0)
    const total4kg = produtos4kg.reduce((acc, p) => acc + (p.estoque_atual || 0), 0)

    // Distribuir 1kg entre zonas 1 e 2
    const qty1_zone1 = Math.min(total1kg, 20)
    const qty1_zone2 = Math.max(0, total1kg - 20)

    // Distribuir 4kg entre zonas 3 e 4
    const qty4_zone3 = Math.min(total4kg, 15)
    const qty4_zone4 = Math.max(0, total4kg - 15)

    // Calcular posi\u00e7\u00f5es usando bin packing
    const potes1kg_z1 = calculateBucketPositions(zone1, controls.bucket1kgRadius, controls.bucket1kgHeight, qty1_zone1, controls.padding_1kg)
    const potes1kg_z2 = calculateBucketPositions(zone2, controls.bucket1kgRadius, controls.bucket1kgHeight, qty1_zone2, controls.padding_1kg)
    const potes4kg_z3 = calculateBucketPositions(zone3, controls.bucket4kgRadius, controls.bucket4kgHeight, qty4_zone3, controls.padding_4kg)
    const potes4kg_z4 = calculateBucketPositions(zone4, controls.bucket4kgRadius, controls.bucket4kgHeight, qty4_zone4, controls.padding_4kg)

    const allPotes1kg = [...potes1kg_z1, ...potes1kg_z2]
    const allPotes4kg = [...potes4kg_z3, ...potes4kg_z4]

    const rotacaoRadianos1kg = controls.rotX_1kg * (Math.PI / 180)
    const rotacaoRadianos4kg = controls.rotX_4kg * (Math.PI / 180)

    return (
        <>
            {/* Iluminação */}
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1.5}
                castShadow
            />
            <pointLight position={[0, 3, 3]} intensity={0.5} />

            {/* Environment HDRI */}
            <Environment preset="city" />

            {/* Modelo 3D da Geladeira */}
            <Suspense fallback={null}>
                <GeladeiraModel
                    rotation={[0, controls.fridgeRotY * (Math.PI / 180), 0]}
                    scale={controls.fridgeScale}
                />
            </Suspense>

            {/* DEBUG: Eixos XYZ */}
            <axesHelper args={[5]} />

            {/* Zonas Wireframe (Vis\u00edveis se showZones ativado) */}
            {controls.showZones && (
                <>
                    <ZoneVisualizer zone={zone1} color="#ff6b00" />
                    <ZoneVisualizer zone={zone2} color="#ff9900" />
                    <ZoneVisualizer zone={zone3} color="#9900ff" />
                    <ZoneVisualizer zone={zone4} color="#6600cc" />
                </>
            )}

            {/* Baldes 1kg (laranja) - Tamanho Din\u00e2mico */}
            {allPotes1kg.map((pos: [number, number, number], i: number) => (
                <mesh key={`1kg-${i}`} position={pos} rotation={[rotacaoRadianos1kg, 0, 0]} scale={[controls.bucketScale_1kg, controls.bucketScale_1kg, controls.bucketScale_1kg]} castShadow>
                    <cylinderGeometry args={[controls.bucket1kgRadius, controls.bucket1kgRadius, controls.bucket1kgHeight, 32]} />
                    <meshStandardMaterial color={COLORS.accent} roughness={0.4} metalness={0.1} />
                </mesh>
            ))}

            {/* Baldes 4kg (roxo) - Tamanho Din\u00e2mico */}
            {allPotes4kg.map((pos: [number, number, number], i: number) => (
                <mesh key={`4kg-${i}`} position={pos} rotation={[rotacaoRadianos4kg, 0, 0]} scale={[controls.bucketScale_4kg, controls.bucketScale_4kg, controls.bucketScale_4kg]} castShadow>
                    <cylinderGeometry args={[controls.bucket4kgRadius, controls.bucket4kgRadius, controls.bucket4kgHeight, 32]} />
                    <meshStandardMaterial color={COLORS.primary} roughness={0.4} metalness={0.1} />
                </mesh>
            ))}

            {/* Controles de câmera */}
            <OrbitControls
                makeDefault
                enableZoom={true}
                enablePan={false}
                minDistance={5}
                maxDistance={35}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2}
            />
        </>
    )
}


// Card de controle de estoque
interface EstoqueCardProps {
    produto: Produto
    onIncrement: () => void
    onDecrement: () => void
    isUpdating: boolean
}

function EstoqueCard({ produto, onIncrement, onDecrement, isUpdating }: EstoqueCardProps) {
    const is1kg = produto.nome.toLowerCase().includes('1kg') || produto.codigo.includes('1KG')
    const bgColor = is1kg ? 'bg-accent-50 border-accent-200' : 'bg-primary-50 border-primary-200'
    const textColor = is1kg ? 'text-accent-600' : 'text-primary-600'

    return (
        <Card className={`${bgColor} border-2`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{produto.nome}</p>
                    <p className="text-xs text-gray-500">{produto.codigo}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDecrement()
                        }}
                        disabled={isUpdating || (produto.estoque_atual || 0) <= 0}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors active:scale-95
                        `}
                    >
                        <Minus className="h-5 w-5" />
                    </button>

                    <span className={`text-3xl font-bold ${textColor} min-w-[3rem] text-center`}>
                        {produto.estoque_atual || 0}
                    </span>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onIncrement()
                        }}
                        disabled={isUpdating}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${is1kg ? 'bg-accent-500 hover:bg-accent-600' : 'bg-primary-500 hover:bg-primary-600'}
                            text-white disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors active:scale-95
                        `}
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </Card>
    )
}

// Página principal
export function Estoque() {
    const toast = useToast()
    const { produtos, loading, updateEstoque } = useProdutos({ includeInactive: false })
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const handleUpdateEstoque = async (produto: Produto, delta: number) => {
        const novoEstoque = Math.max(0, (produto.estoque_atual || 0) + delta)
        setUpdatingId(produto.id)

        const result = await updateEstoque(produto.id, novoEstoque)

        setUpdatingId(null)

        if (!result) {
            toast.error('Erro ao atualizar estoque')
        }
    }

    // Filtrar só produtos de massa (1kg ou 4kg)
    const produtosMassa = produtos.filter(p =>
        p.nome.toLowerCase().includes('kg') ||
        p.codigo.includes('KG')
    )

    // Totais para exibição
    const total1kg = produtosMassa
        .filter(p => p.nome.toLowerCase().includes('1kg') || p.codigo.includes('1KG'))
        .reduce((acc, p) => acc + (p.estoque_atual || 0), 0)
    const total4kg = produtosMassa
        .filter(p => p.nome.toLowerCase().includes('4kg') || p.codigo.includes('4KG'))
        .reduce((acc, p) => acc + (p.estoque_atual || 0), 0)

    if (loading) {
        return (
            <>
                <Header title="Estoque" showBack />
                <LoadingScreen message="Carregando estoque..." />
            </>
        )
    }

    return (
        <>
            <Header title="🧊 Geladeira" showBack />
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                {/* Cena 3D - Dois terços superiores */}
                <div className="h-[65vh] bg-gradient-to-b from-blue-50 to-gray-100 relative">
                    <Canvas
                        shadows
                        camera={{ position: [0, 0, 22], fov: 45 }}
                    >
                        <GeladeiraScene produtos={produtosMassa} />
                    </Canvas>

                    {/* Legenda flutuante */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                            <div className="w-3 h-3 rounded-full bg-accent-500" />
                            <span className="font-medium">1kg: {total1kg}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                            <div className="w-3 h-3 rounded-full bg-primary-500" />
                            <span className="font-medium">4kg: {total4kg}</span>
                        </div>
                    </div>
                </div>

                {/* Controles - Metade inferior */}
                <div className="flex-1 overflow-y-auto">
                    <PageContainer className="py-4">
                        <h2 className="text-sm font-medium text-gray-500 mb-3">Controle de Estoque</h2>

                        {produtosMassa.length === 0 ? (
                            <Card className="text-center py-8 text-gray-500">
                                <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum produto de massa cadastrado</p>
                                <p className="text-xs mt-1">Cadastre produtos com "1kg" ou "4kg" no nome</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {produtosMassa.map(produto => (
                                    <EstoqueCard
                                        key={produto.id}
                                        produto={produto}
                                        onIncrement={() => handleUpdateEstoque(produto, 1)}
                                        onDecrement={() => handleUpdateEstoque(produto, -1)}
                                        isUpdating={updatingId === produto.id}
                                    />
                                ))}
                            </div>
                        )}
                    </PageContainer>
                </div>
            </div>
        </>
    )
}
