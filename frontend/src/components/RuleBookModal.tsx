import React, { useState } from 'react';
import { X, BookOpen, Shield, HelpCircle, Coins } from 'lucide-react';

interface RuleBookModalProps {
  onClose: () => void;
}

export const RuleBookModal: React.FC<RuleBookModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'characters' | 'actions' | 'faq'>('basics');

  const getTabStyle = (tab: typeof activeTab) => {
    const isActive = activeTab === tab;
    return {
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
      background: 'none',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      outline: 'none',
      transition: 'all 0.2s',
    };
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal-content glass-panel-heavy" style={{ padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--accent-gold)' }} />
            <h2 style={{ fontSize: '18px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Coup Game Rule Book
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '16px', flexShrink: 0 }}>
          <button onClick={() => setActiveTab('basics')} style={getTabStyle('basics')}>Basics</button>
          <button onClick={() => setActiveTab('characters')} style={getTabStyle('characters')}>Roles</button>
          <button onClick={() => setActiveTab('actions')} style={getTabStyle('actions')}>Actions Cheat Sheet</button>
          <button onClick={() => setActiveTab('faq')} style={getTabStyle('faq')}>F.A.Q.</button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {activeTab === 'basics' && (
            <div>
              <h3 style={{ color: 'white', fontSize: '15px', marginBottom: '8px' }}>Objective</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                To be the last player standing with any remaining <strong>influence</strong> (face-down character cards). Once a player loses both cards, they are eliminated.
              </p>

              <h3 style={{ color: 'white', fontSize: '15px', marginBottom: '8px' }}>Core Philosophy</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                You don't need to actually have the cards you claim to play. You can <strong>bluff</strong> and declare any character action or counter-action. However, if another player challenges you and you cannot prove your claim, you lose an influence!
              </p>

              <h3 style={{ color: 'white', fontSize: '15px', marginBottom: '8px' }}>Challenging</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Whenever a player claims a character role (to take an action or block an action), any other player can click <strong>Challenge</strong>.
              </p>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <li style={{ marginBottom: '6px' }}>
                  <strong>If you were telling the truth</strong>: You must reveal the matching card from your hand. You shuffle it back into the Court Deck and draw a new one. The challenger loses one influence.
                </li>
                <li>
                  <strong>If you were bluffing</strong>: You must reveal that you do not have it (by choosing one of your cards to flip face-up permanently). The action is cancelled.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'characters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Duke */}
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--color-duke)', background: 'rgba(184, 75, 245, 0.03)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--color-duke)', marginBottom: '4px' }}>Duke</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Action</strong>: Take <strong>Tax</strong> (+3 Coins from Treasury).<br />
                  <strong>Counter-Action</strong>: Blocks <strong>Foreign Aid</strong> (claims Duke).
                </p>
              </div>

              {/* Assassin */}
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--color-assassin)', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--color-assassin)', marginBottom: '4px' }}>Assassin</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Action</strong>: <strong>Assassinate</strong> a target player (-3 Coins cost). Target must discard an influence card unless they block.<br />
                  <em>Note: If target challenges and Assassin bluffs, Assassin loses 1 card. If target bluffs Contessa and get challenged, they lose 2 cards (1 for block challenge, 1 for assassination).</em>
                </p>
              </div>

              {/* Captain */}
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--color-captain)', background: 'rgba(245, 158, 11, 0.03)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--color-captain)', marginBottom: '4px' }}>Captain</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Action</strong>: <strong>Steal</strong> 2 Coins from a target player (or less if target only has 1 or 0 coins).<br />
                  <strong>Counter-Action</strong>: Blocks <strong>Steal</strong> (claims Captain).
                </p>
              </div>

              {/* Ambassador */}
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--color-ambassador)', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--color-ambassador)', marginBottom: '4px' }}>Ambassador</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Action</strong>: <strong>Exchange</strong> (Draw 2 cards from deck, shuffle with active hand, choose which to keep, return 2).<br />
                  <strong>Counter-Action</strong>: Blocks <strong>Steal</strong> (claims Ambassador).
                </p>
              </div>

              {/* Contessa */}
              <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--color-contessa)', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--color-contessa)', marginBottom: '4px' }}>Contessa</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>Counter-Action</strong>: Blocks <strong>Assassination</strong> (claims Contessa).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'white' }}>
                    <th style={{ padding: '8px' }}>Action</th>
                    <th style={{ padding: '8px' }}>Cost</th>
                    <th style={{ padding: '8px' }}>Claim</th>
                    <th style={{ padding: '8px' }}>Effect</th>
                    <th style={{ padding: '8px' }}>Can Block?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>Income</td>
                    <td style={{ padding: '8px' }}>0</td>
                    <td style={{ padding: '8px' }}>None</td>
                    <td style={{ padding: '8px' }}>+1 Coin</td>
                    <td style={{ padding: '8px' }}>No</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>Foreign Aid</td>
                    <td style={{ padding: '8px' }}>0</td>
                    <td style={{ padding: '8px' }}>None</td>
                    <td style={{ padding: '8px' }}>+2 Coins</td>
                    <td style={{ padding: '8px', color: 'var(--color-duke)' }}>Yes (Duke)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>Coup</td>
                    <td style={{ padding: '8px' }}>7</td>
                    <td style={{ padding: '8px' }}>None</td>
                    <td style={{ padding: '8px' }}>Target loses 1 card</td>
                    <td style={{ padding: '8px' }}>No</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-duke)', fontWeight: 600 }}>Tax</td>
                    <td style={{ padding: '8px' }}>0</td>
                    <td style={{ padding: '8px' }}>Duke</td>
                    <td style={{ padding: '8px' }}>+3 Coins</td>
                    <td style={{ padding: '8px' }}>No</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-assassin)', fontWeight: 600 }}>Assassinate</td>
                    <td style={{ padding: '8px' }}>3</td>
                    <td style={{ padding: '8px' }}>Assassin</td>
                    <td style={{ padding: '8px' }}>Target loses 1 card</td>
                    <td style={{ padding: '8px', color: 'var(--color-contessa)' }}>Yes (Contessa)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-captain)', fontWeight: 600 }}>Steal</td>
                    <td style={{ padding: '8px' }}>0</td>
                    <td style={{ padding: '8px' }}>Captain</td>
                    <td style={{ padding: '8px' }}>Take 2 coins from target</td>
                    <td style={{ padding: '8px', color: 'var(--accent-gold)' }}>Yes (Capt/Amb)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', color: 'var(--color-ambassador)', fontWeight: 600 }}>Exchange</td>
                    <td style={{ padding: '8px' }}>0</td>
                    <td style={{ padding: '8px' }}>Ambassador</td>
                    <td style={{ padding: '8px' }}>Swap cards with deck</td>
                    <td style={{ padding: '8px' }}>No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ color: 'white' }}>Q: Must I Coup if I have 10 coins?</strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Yes, Coup is mandatory if you start your turn with 10 or more coins. Other options will be disabled.
                </p>
              </div>
              <div>
                <strong style={{ color: 'white' }}>Q: Can a Block counter-action be challenged?</strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Yes! Counter-blocks (like claiming Contessa to block assassination) can be challenged by anyone. If the blocker fails, their block fails and they lose influence.
                </p>
              </div>
              <div>
                <strong style={{ color: 'white' }}>Q: How do the [TRUTH] highlights work?</strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  This digital version aids you by showing a green <code>[TRUTH]</code> tag on actions and blocks if you actually hold the required card in your hand. This helps you quickly know when you are bluffing!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
