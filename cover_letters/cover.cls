\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{cover}[2026/01/01 v1.0 Custom cover letter class]

% Base on article
\LoadClass[11pt,a4paper]{article}

% ---- packages ----
\RequirePackage{fontspec}
\RequirePackage[scale=0.75,top=2.5cm,bottom=2.5cm,left=2.5cm,right=2.5cm]{geometry}
\RequirePackage{xcolor}
\RequirePackage{setspace}
\RequirePackage{ragged2e}
\RequirePackage{parskip}

% ---- fonts (fallback-safe) ----
\IfFontExistsTF{Lato}{\setsansfont{Lato}}{}
\IfFontExistsTF{Raleway}{\setsansfont{Raleway}}{}
\renewcommand{\familydefault}{\sfdefault}

% ---- colors ----
\definecolor{coveraccent}{HTML}{2B5475}
\definecolor{covertext}{HTML}{333333}

% ---- metadata commands ----
\newcommand{\covername}[1]{\def\@covername{#1}}
\newcommand{\coveraddress}[1]{\def\@coveraddress{#1}}
\newcommand{\coverphone}[1]{\def\@coverphone{#1}}
\newcommand{\coveremail}[1]{\def\@coveremail{#1}}
\newcommand{\coverlink}[1]{\def\@coverlink{#1}}
\newcommand{\recipientname}[1]{\def\@recipientname{#1}}
\newcommand{\recipientcompany}[1]{\def\@recipientcompany{#1}}
\newcommand{\recipientaddress}[1]{\def\@recipientaddress{#1}}
\newcommand{\coverdate}[1]{\def\@coverdate{#1}}
\newcommand{\coversubject}[1]{\def\@coversubject{#1}}

% ---- defaults (placeholders) ----
\covername{[YOUR_NAME]}
\coveraddress{[YOUR_ADDRESS]}
\coverphone{[YOUR_PHONE]}
\coveremail{[YOUR_EMAIL]}
\coverlink{[YOUR_LINK]}
\recipientname{[RECIPIENT_NAME]}
\recipientcompany{[COMPANY_NAME]}
\recipientaddress{[COMPANY_ADDRESS]}
\coverdate{\today}
\coversubject{[JOB_TITLE]}

% ---- header block ----
\newcommand{\makeheader}{%
  \noindent
  \begin{minipage}[t]{0.5\textwidth}
    \vspace{0pt}
    {\large\bfseries\color{coveraccent}\@covername}\\[3pt]
    {\small\color{covertext}\@coveraddress}\\
    {\small\color{covertext}\@coverphone}\\
    {\small\color{covertext}\@coveremail}\\
    {\small\color{covertext}\@coverlink}
  \end{minipage}%
  \hfill
  \begin{minipage}[t]{0.4\textwidth}
    \vspace{0pt}
    \raggedleft
    {\small\color{covertext}\@coverdate}\\[6pt]
    {\small\color{covertext}\@recipientname}\\
    {\small\color{covertext}\@recipientcompany}\\
    {\small\color{covertext}\@recipientaddress}
  \end{minipage}
  \par\vspace{1.2cm}
}

% ---- subject line ----
\newcommand{\makesubject}{%
  \noindent\textbf{\color{coveraccent}Re: \@coversubject}\par
  \vspace{0.6cm}
}

% ---- body environment ----
\newenvironment{coverbody}{%
  \setstretch{1.15}%
  \justifying
}{%
}
