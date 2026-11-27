my_broom = wizard.find_nearest("broom")
wizard.move_left(wizard.position.x - my_broom.position.x)
wizard.move_up(wizard.position.y - my_broom.position.y)
my_broom.untie()
