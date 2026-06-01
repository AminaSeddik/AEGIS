import React from 'react';

interface Props {
  eyebrow: string;          // e.g. "06 · CRYPTOGRAPHIC LAYER"
  title: string;            // e.g. "Crypto Health"
  titleEm?: string;         // accent suffix, e.g. "·"
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const ViewShell: React.FC<Props> = ({ eyebrow, title, titleEm = '·', subtitle, actions, children }) => {
  return (
    <>
      <div className="view-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title} {titleEm && <em>{titleEm}</em>}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="view-actions">{actions}</div>}
      </div>
      {children}
    </>
  );
};

export default ViewShell;
