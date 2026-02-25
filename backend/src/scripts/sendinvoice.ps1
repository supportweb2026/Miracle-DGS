param (
    [string]$filePath,  # Paramètre pour le chemin du fichier à joindre
    [string]$email,     # Paramètre pour l'adresse email du destinataire
 [string]$firstName
)

# Afficher un message pour indiquer que le script commence
Write-Host "Démarrage du script PowerShell pour envoyer un email..."

# Vérifier que le paramètre filePath et email sont passés correctement
Write-Host "Fichier joint : $filePath"
Write-Host "Destinataire : $email"

# Créer l'instance Outlook
$Outlook = New-Object -ComObject Outlook.Application
Write-Host "Instance Outlook créée."

# Créer un nouvel e-mail
$Mail = $Outlook.CreateItem(0)
Write-Host "Nouvel e-mail créé."

# Définir l'objet de l'email
$Mail.Subject = "Votre facture"
Write-Host "Sujet de l'email défini."

# Définir le corps de l'email (générique)
#$Mail.Body = "Bonjour,$(`r`n)`r`nVeuillez trouver ci-joint la facture que vous avez demandee.$(`r`n)`r`nCordialement,$(`r`n)Votre equipe"
$Mail.Body = "Bonjour $firstName,`r`n`r`nVeuillez trouver ci-joint la facture que vous avez demandée.`r`n`r`nCordialement,`r`nVotre equipe`r`nDGS`r`nCentre medicaux`r`nLibreville Gabon`r`ndgsgabon2.0@gmail.com`r`n+247 074 80 87 81`r`nwww.dgs-gabon.com"
Write-Host "Corps de l'email défini."

# Ajouter l'adresse du destinataire
$Mail.To = $email  # Utilise le paramètre passé pour l'email
Write-Host "Destinataire défini."

# Ajouter la pièce jointe
$Mail.Attachments.Add($filePath)
Write-Host "Pièce jointe ajoutée."

# Afficher l'email dans Outlook pour révision
$Mail.Display()
Write-Host "Email affiché dans Outlook."

Write-Host "Le script PowerShell s'est terminé."
