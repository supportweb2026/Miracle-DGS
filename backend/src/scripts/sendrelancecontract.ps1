param (
    [string]$email,      # Adresse email du destinataire
    [string]$firstName   # Prénom du destinataire
)

Write-Host "Démarrage de la relance pour expiration de contrat..."
Write-Host "Destinataire : $email"
Write-Host "Prénom : $firstName"

# Créer l'instance Outlook
$Outlook = New-Object -ComObject Outlook.Application
Write-Host "Instance Outlook créée."

# Créer un nouvel e-mail
$Mail = $Outlook.CreateItem(0)
Write-Host "Nouvel e-mail créé."

# Définir l'objet de l'email
$Mail.Subject = "Relance : Expiration prochaine de votre contrat"
Write-Host "Sujet de l'email défini."

# Corps du message de relance
$Mail.Body = "Bonjour $firstName,`r`n`r`nNous souhaitons vous rappeler que votre contrat arrive bientôt à expiration.`r`nN'hésitez pas à nous contacter pour le renouveler et éviter toute interruption de service.`r`n`r`nCordialement,`r`nVotre équipe DGS`r`nCentre médicaux`r`nLibreville, Gabon`r`ndgsgabon2.0@gmail.com`r`n+247 074 80 87 81`r`nwww.dgs-gabon.com"
Write-Host "Corps de l'email défini."

# Adresse du destinataire
$Mail.To = $email
Write-Host "Adresse du destinataire définie."

# Afficher l'e-mail pour révision avant envoi
$Mail.Display()
Write-Host "Email affiché dans Outlook pour vérification."
