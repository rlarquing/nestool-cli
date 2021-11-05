module.exports=`
@OneToOne(() => $nameEntity, { onDelete: 'CASCADE'})
@JoinColumn({ name: '$name_id' })`;