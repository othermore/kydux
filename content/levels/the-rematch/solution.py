def two_rings(to_second, to_next):
    wizard.move_up(2)
    wizard.move_right(to_second)
    wizard.move_down(2)
    wizard.move_right(to_next)

wizard.cast("drevo")
wizard.move_right(2)
two_rings(3, 4)
two_rings(2, 5)
two_rings(2, 4)
two_rings(2, 1)
