from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Contacto


@receiver(post_save, sender=Contacto)
def notify_new_entity_request(sender, instance, created, **kwargs):
    if not created:
        return

    recipients = getattr(settings, 'ENTITY_REQUEST_NOTIFICATION_EMAILS', None)
    if not recipients:
        recipients = [email for _, email in getattr(settings, 'ADMINS', [])]

    if not recipients:
        return

    subject = f"Nueva solicitud de entidad: {instance.entidad or instance.name}"
    message = (
        f"Se ha recibido una nueva solicitud de entidad.\n\n"
        f"Entidad: {instance.entidad or '-'}\n"
        f"Contacto: {instance.name}\n"
        f"Email: {instance.email}\n"
        f"Telefono: {instance.telefono or '-'}\n"
        f"Tipo de lugar: {instance.tipo_lugar or '-'}\n"
        f"Direccion: {instance.direccion or '-'}\n"
        f"Presentacion: {instance.presentacion or '-'}\n"
        f"Estado: {instance.estado_solicitud}\n"
        f"Solicitud ID: {instance.id}\n"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@deporteca.local'),
        recipient_list=recipients,
        fail_silently=True,
    )
