broom = wizard.find_nearest("broom")
wizard.move_left(wizard.position.x - broom.position.x)
wizard.move_up(wizard.position.y - broom.position.y)
broom.untie()
