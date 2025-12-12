import { Phone, MapPin, User, Building2 } from 'lucide-react'
import { ClienteNome } from './ClienteNome' // Added import

// ...


import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatPhone, formatRelativeDate } from '../../utils/formatters'
import {
    CONTATO_STATUS_LABELS,
    CONTATO_STATUS_COLORS,
    CONTATO_TIPO_LABELS,
    SUBTIPOS_B2B_LABELS,
} from '../../constants'
import type { Contato } from '../../types/database'

interface ContatoCardProps {
    contato: Contato
    onClick?: () => void
    nomeIndicador?: string | null
    nivelEmoji?: string
}

export function ContatoCard({ contato, onClick, nomeIndicador, nivelEmoji }: ContatoCardProps) {
    const navigate = useNavigate()

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else {
            navigate(`/contatos/${contato.id}`)
        }
    }

    const statusColor = CONTATO_STATUS_COLORS[contato.status] as 'success' | 'warning' | 'gray'
    const TipoIcon = contato.tipo === 'B2B' ? Building2 : User

    return (
        <Card hover onClick={handleClick} className="cursor-pointer">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${contato.tipo === 'B2B' ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-600'}
          `}>
                        <TipoIcon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <ClienteNome
                                contato={contato}
                                className="truncate flex-1 min-w-0"
                            />
                            <Badge variant={statusColor} className="flex-shrink-0 self-start mt-0.5">
                                {CONTATO_STATUS_LABELS[contato.status]}
                            </Badge>
                            {nivelEmoji && (
                                <span className="text-sm" title="Nível do cliente">{nivelEmoji}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{formatPhone(contato.telefone)}</span>
                        </div>

                        {contato.bairro && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">{contato.bairro}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>{CONTATO_TIPO_LABELS[contato.tipo]}</span>
                            {contato.tipo === 'B2B' && contato.subtipo && (
                                <>
                                    <span>•</span>
                                    <span>{SUBTIPOS_B2B_LABELS[contato.subtipo] || contato.subtipo}</span>
                                </>
                            )}
                            {contato.origem === 'indicacao' && (
                                <>
                                    <span>•</span>
                                    <span className="text-accent-600">
                                        📣 {nomeIndicador ? `Indicado por: ${nomeIndicador}` : 'Indicação'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Meta info */}
                <div className="text-xs text-gray-400 text-right flex-shrink-0">
                    {formatRelativeDate(contato.criado_em)}
                </div>
            </div>
        </Card>
    )
}
