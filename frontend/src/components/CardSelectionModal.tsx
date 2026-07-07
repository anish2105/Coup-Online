import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';

interface CardSelectionModalProps {
  title: string;
  description: string;
  cards: string[]; // List of card roles (e.g. ['duke', 'assassin', 'captain'])
  countToSelect: number; // 1 for influence loss, 1 or 2 for Ambassador
  originalCount?: number; // Optional count of original active cards (Ambassador exchange)
  onSubmit: (selectedIndexes: number[]) => void;
}

export const CardSelectionModal: React.FC<CardSelectionModalProps> = ({
  title,
  description,
  cards,
  countToSelect,
  originalCount,
  onSubmit,
}) => {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const handleCardClick = (index: number) => {
    if (countToSelect === 1) {
      // Single select (e.g. lose influence)
      setSelectedIndexes([index]);
    } else {
      // Multi select (e.g. Ambassador exchange)
      if (selectedIndexes.includes(index)) {
        setSelectedIndexes(selectedIndexes.filter((i) => i !== index));
      } else if (selectedIndexes.length < countToSelect) {
        setSelectedIndexes([...selectedIndexes, index]);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'duke':
        return 'var(--color-duke)';
      case 'assassin':
        return 'var(--color-assassin)';
      case 'captain':
        return 'var(--color-captain)';
      case 'ambassador':
        return 'var(--color-ambassador)';
      case 'contessa':
        return 'var(--color-contessa)';
      default:
        return 'var(--text-muted)';
    }
  };

  const handleSubmit = () => {
    if (selectedIndexes.length === countToSelect) {
      onSubmit(selectedIndexes);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel-heavy" style={{ padding: '28px', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-gold)' }} />
          <h2 style={{ fontSize: '20px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </h2>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
          {description}
        </p>

        {/* Card Options Display */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
          {cards.map((role, idx) => {
            const isSelected = selectedIndexes.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => handleCardClick(idx)}
                className="glass-panel"
                style={{
                  width: '90px',
                  height: '136px',
                  borderRadius: '10px',
                  border: isSelected
                    ? `2.5px solid ${getRoleColor(role)}`
                    : '1.5px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 0 15px ${getRoleColor(role)}40` : 'none',
                  transform: isSelected ? 'scale(1.05) translateY(-4px)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {/* Image background */}
                <img
                  src={`/assets/${role.toLowerCase()}.png`}
                  alt={role}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0.85,
                  }}
                />

                {/* Original/New badge */}
                {originalCount !== undefined && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      fontSize: '8px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      zIndex: 10,
                      textTransform: 'uppercase',
                      border: idx < originalCount ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid var(--accent-gold)',
                      backgroundColor: idx < originalCount ? 'rgba(0, 0, 0, 0.7)' : 'rgba(212, 175, 55, 0.25)',
                      color: idx < originalCount ? '#fff' : 'var(--accent-gold)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {idx < originalCount ? 'Original' : 'New'}
                  </div>
                )}

                {/* Selected Checkmark overlay */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: getRoleColor(role),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      zIndex: 10,
                    }}
                  >
                    <Check size={12} strokeWidth={3} style={{ color: 'white' }} />
                  </div>
                )}

                {/* Role text label at bottom */}
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.85)',
                    padding: '4px 6px',
                    textAlign: 'center',
                    borderTop: `1px solid ${isSelected ? getRoleColor(role) : 'rgba(255,255,255,0.05)'}`,
                    zIndex: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: isSelected ? getRoleColor(role) : 'white',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          disabled={selectedIndexes.length !== countToSelect}
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px' }}
        >
          Confirm Selection ({selectedIndexes.length}/{countToSelect})
        </button>
      </div>
    </div>
  );
};
