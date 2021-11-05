module.exports=`
@ManyToOne(() => $nameEntity, ($name) => $name.$atributos, {
    onDelete: 'CASCADE',
})
@JoinColumn({name: '$name_id'})`;