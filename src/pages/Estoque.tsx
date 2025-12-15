import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
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

// Componente 3D: Pote de massa
interface Pote3DProps {
    tipo: '1kg' | '4kg'
    position: [number, number, number]
}

function Pote3D({ tipo, position }: Pote3DProps) {
    const is1kg = tipo === '1kg'
    // Tamanhos ajustados para nova escala (80% do anterior)
    const radius = is1kg ? 0.06 : 0.10
    const height = is1kg ? 0.10 : 0.15
    const color = is1kg ? COLORS.accent : COLORS.primary

    return (
        <mesh position={position} castShadow>
            <cylinderGeometry args={[radius, radius, height, 32]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </mesh>
    )
}

// Componente 3D: Modelo da Geladeira
function GeladeiraModel() {
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
            scale={0.4}
            position={[0, -1.6, 0]}
            rotation={[0, 0, 0]}
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
    // Separar produtos por tipo (baseado no nome/código)
    const produtos1kg = produtos.filter(p =>
        p.nome.toLowerCase().includes('1kg') || p.codigo.includes('1KG')
    )
    const produtos4kg = produtos.filter(p =>
        p.nome.toLowerCase().includes('4kg') || p.codigo.includes('4KG')
    )

    // Offsets de prateleira (ajustado para nova escala 0.4)
    const prateleira1kgY = 0.0    // Prateleira do meio
    const prateleira4kgY = -0.65  // Prateleira de baixo

    // Gerar posições para potes de 1kg (prateleira de cima)
    const potes1kg: [number, number, number][] = []
    const total1kg = produtos1kg.reduce((acc, p) => acc + (p.estoque_atual || 0), 0)
    for (let i = 0; i < Math.min(total1kg, 20); i++) {
        const col = i % 5
        const row = Math.floor(i / 5)
        const stack = Math.floor(i / 10)
        potes1kg.push([
            -0.24 + col * 0.14,          // X: espalhar horizontalmente (80%)
            prateleira1kgY + row * 0.12, // Y: empilhar verticalmente
            -0.4 + stack * 0.16          // Z: dentro da geladeira
        ])
    }

    // Gerar posições para potes de 4kg (prateleira de baixo)
    const potes4kg: [number, number, number][] = []
    const total4kg = produtos4kg.reduce((acc, p) => acc + (p.estoque_atual || 0), 0)
    for (let i = 0; i < Math.min(total4kg, 12); i++) {
        const col = i % 4
        const row = Math.floor(i / 4)
        const stack = Math.floor(i / 8)
        potes4kg.push([
            -0.20 + col * 0.18,          // X: espalhar horizontalmente (80%)
            prateleira4kgY + row * 0.16, // Y: empilhar verticalmente
            -0.4 + stack * 0.20          // Z: dentro da geladeira
        ])
    }

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
                <GeladeiraModel />
            </Suspense>

            {/* Potes 1kg (cima - laranja) */}
            {potes1kg.map((pos, i) => (
                <Pote3D key={`1kg-${i}`} tipo="1kg" position={pos} />
            ))}

            {/* Potes 4kg (baixo - roxo) */}
            {potes4kg.map((pos, i) => (
                <Pote3D key={`4kg-${i}`} tipo="4kg" position={pos} />
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
                        onClick={onDecrement}
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
                        onClick={onIncrement}
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
